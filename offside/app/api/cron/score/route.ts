import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";

// Hobby plan allows up to 300s with Fluid compute enabled — importing a full
// season across 6 competitions needs more than the 10s default.
export const maxDuration = 120;

// The "top 5 leagues + Champions League" — all included in football-data.org's
// free tier. Add/remove codes here to change coverage.
const COMPETITIONS = ["PL", "CL", "PD", "SA", "FL1", "BL1"];

type ApiMatch = {
  id: number;
  homeTeam: { name: string };
  awayTeam: { name: string };
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string;
  score: { fullTime: { home: number | null; away: number | null } };
};

type ApiMatchWithCompetition = ApiMatch & { competition: string };

function roundLabel(m: ApiMatch): string {
  if (m.matchday) return `Matchday ${m.matchday}`;
  return m.stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type FetchResult = { code: string; matches: ApiMatchWithCompetition[]; status: number | null; error: string | null };

async function fetchCompetition(code: string, apiKey: string): Promise<FetchResult> {
  try {
    const res = await fetch(`https://api.football-data.org/v4/competitions/${code}/matches`, {
      headers: { "X-Auth-Token": apiKey },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return { code, matches: [], status: res.status, error: await res.text() };
    const data = await res.json();
    const matches = (data.matches ?? []).map((m: ApiMatch) => ({ ...m, competition: code }));
    return { code, matches, status: res.status, error: null };
  } catch (e) {
    return { code, matches: [], status: null, error: e instanceof Error ? e.message : "unknown error" };
  }
}

// Imports the full season's fixtures (bulk insert, skips ones we already
// have) and fills results for any match that's finished but doesn't have a
// score in our DB yet. Non-fatal on failure — falls back to whatever's
// already there if the API key is missing or a competition fetch fails.
async function syncFixturesAndResults() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return { hasApiKey: false, perCompetition: [] as FetchResult[], matchesFound: 0, resultsUpdated: 0 };

  const results = await Promise.all(COMPETITIONS.map((code) => fetchCompetition(code, apiKey)));
  const allMatches = results.flatMap((r) => r.matches);
  const diagnostics = results.map((r) => ({ code: r.code, fetched: r.matches.length, status: r.status, error: r.error }));

  if (allMatches.length === 0) return { hasApiKey: true, perCompetition: diagnostics, matchesFound: 0, resultsUpdated: 0 };

  // Bulk insert any fixtures we don't have yet — one fast statement instead
  // of hundreds of individual upserts.
  await prisma.match.createMany({
    data: allMatches.map((m) => ({
      id: String(m.id),
      competition: m.competition,
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      round: roundLabel(m),
      kickoff: new Date(m.utcDate),
      homeResult: m.status === "FINISHED" || m.status === "AWARDED" ? m.score.fullTime.home : null,
      awayResult: m.status === "FINISHED" || m.status === "AWARDED" ? m.score.fullTime.away : null,
    })),
    skipDuplicates: true,
  });

  // For matches we already had as fixtures, fill in results that have
  // appeared since the last sync (only touches the small subset that
  // actually changed, not the whole dataset).
  const pending = await prisma.match.findMany({ where: { homeResult: null } });
  const pendingIds = new Set(pending.map((m) => m.id));

  let resultsUpdated = 0;
  for (const m of allMatches) {
    if (!pendingIds.has(String(m.id))) continue;
    if (m.status !== "FINISHED" && m.status !== "AWARDED") continue;
    if (m.score.fullTime.home === null || m.score.fullTime.away === null) continue;

    await prisma.match.update({
      where: { id: String(m.id) },
      data: { homeResult: m.score.fullTime.home, awayResult: m.score.fullTime.away },
    });
    resultsUpdated++;
  }

  return { hasApiKey: true, perCompetition: diagnostics, matchesFound: allMatches.length, resultsUpdated };
}

// Once every match we have for a competition is finished (no more pending
// results), that competition's season is treated as complete: snapshot each
// participating user's total points for it into SeasonArchive. Safe to call
// every cron run — the unique constraint means it's a no-op once archived.
async function archiveCompletedSeasons() {
  for (const code of COMPETITIONS) {
    const matches = await prisma.match.findMany({ where: { competition: code } });
    if (matches.length === 0) continue;

    const stillPending = matches.some((m) => m.homeResult === null);
    if (stillPending) continue;

    const latestKickoff = matches.reduce(
      (max, m) => (m.kickoff > max ? m.kickoff : max),
      matches[0].kickoff
    );
    const seasonLabel = latestKickoff.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const predictions = await prisma.prediction.findMany({ where: { match: { competition: code } } });
    const pointsByUser = new Map<string, number>();
    for (const p of predictions) {
      pointsByUser.set(p.userId, (pointsByUser.get(p.userId) ?? 0) + (p.pointsAwarded ?? 0));
    }

    for (const [userId, points] of pointsByUser) {
      const existing = await prisma.seasonArchive.findUnique({
        where: { userId_competition_seasonLabel: { userId, competition: code, seasonLabel } },
      });
      if (existing) continue;

      await prisma.seasonArchive.create({ data: { userId, competition: code, seasonLabel, points } });
    }
  }
}

async function handleCronRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const syncInfo = await syncFixturesAndResults();

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

await archiveCompletedSeasons();

  return NextResponse.json({ scored: totalScored, competitions: COMPETITIONS, sync: syncInfo });
}

// Vercel's actual Cron trigger always sends GET, never POST — this was the
// second bug preventing auto-sync from ever running automatically. POST is
// kept too so manual curl testing keeps working exactly as before.
export async function GET(req: NextRequest) {
  return handleCronRequest(req);
}

export async function POST(req: NextRequest) {
  return handleCronRequest(req);
}
