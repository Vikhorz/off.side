import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";

type ApiMatch = {
  homeTeam: { name: string };
  awayTeam: { name: string };
  status: string;
  score: { fullTime: { home: number | null; away: number | null } };
};

// Pulls finished match results from football-data.org's free World Cup feed
// and fills in Match.homeResult/awayResult for any match we don't have a
// result for yet. Non-fatal on failure — if the API is unreachable or the
// key is missing, we just skip syncing and score whatever's already in the DB
// (which still supports manual entry as a fallback).
async function syncResultsFromApi() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return;

  try {
    const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
      headers: { "X-Auth-Token": apiKey },
      next: { revalidate: 0 },
    });
    if (!res.ok) return;
    const data = await res.json();
    const apiMatches: ApiMatch[] = data.matches ?? [];

    const pending = await prisma.match.findMany({ where: { homeResult: null } });

    for (const ourMatch of pending) {
      const ourHome = ourMatch.homeTeam.toLowerCase().trim();
      const ourAway = ourMatch.awayTeam.toLowerCase().trim();

      const found = apiMatches.find((m) => {
        const apiHome = m.homeTeam?.name?.toLowerCase().trim() ?? "";
        const apiAway = m.awayTeam?.name?.toLowerCase().trim() ?? "";
        return (
          (apiHome.includes(ourHome) || ourHome.includes(apiHome)) &&
          (apiAway.includes(ourAway) || ourAway.includes(apiAway))
        ) || (
          (apiHome.includes(ourAway) || ourAway.includes(apiHome)) &&
          (apiAway.includes(ourHome) || ourHome.includes(apiAway))
        );
      });

      if (!found) continue;
      if (found.status !== "FINISHED" && found.status !== "AWARDED") continue;
      if (found.score.fullTime.home === null || found.score.fullTime.away === null) continue;

      const apiHome = found.homeTeam.name.toLowerCase().trim();
      const namesAligned = apiHome.includes(ourHome) || ourHome.includes(apiHome);

      const homeResult = namesAligned ? found.score.fullTime.home : found.score.fullTime.away;
      const awayResult = namesAligned ? found.score.fullTime.away : found.score.fullTime.home;

      await prisma.match.update({ where: { id: ourMatch.id }, data: { homeResult, awayResult } });
    }
  } catch {
    // Silently skip sync on any network/parse error — manual entry still works.
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await syncResultsFromApi();

  const matches = await prisma.match.findMany({
    where: { homeResult: { not: null }, awayResult: { not: null }, scoredAt: null },
    include: { predictions: true },
  });

  let totalScored = 0;

  for (const match of matches) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const pred of match.predictions) {
        const pts = calculatePoints(
          { homeScore: pred.homeScore, awayScore: pred.awayScore },
          { homeResult: match.homeResult!, awayResult: match.awayResult! },
          pred.boosted
        );
        await tx.prediction.update({ where: { id: pred.id }, data: { pointsAwarded: pts } });
        await tx.user.update({ where: { id: pred.userId }, data: { totalPoints: { increment: pts } } });
      }
      await tx.match.update({ where: { id: match.id }, data: { scoredAt: new Date() } });
    });
    totalScored++;
  }

  return NextResponse.json({ scored: totalScored });
}
