import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public activity feed: shows WHO predicted and WHEN, never the actual scores
// before a match locks — revealing scores pre-kickoff would let people copy picks.
export async function GET() {
  const predictions = await prisma.prediction.findMany({
    orderBy: { submittedAt: "desc" },
    take: 15,
    include: { user: { select: { username: true } }, match: { select: { homeTeam: true, awayTeam: true, kickoff: true, homeResult: true } } },
  });

  const feed = predictions.map((p: typeof predictions[number]) => {
    const locked = new Date() >= new Date(p.match.kickoff);
    return {
      username: p.user.username,
      match: `${p.match.homeTeam} vs ${p.match.awayTeam}`,
      submittedAt: p.submittedAt,
      boosted: p.boosted,
      revealed: locked,
      prediction: locked ? `${p.homeScore}-${p.awayScore}` : null,
      points: locked ? p.pointsAwarded : null,
    };
  });

  return NextResponse.json(feed);
}
