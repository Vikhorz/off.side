import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const predictions = await prisma.prediction.findMany({
    where: { userId: session.user.id },
    include: { match: true },
    orderBy: { match: { kickoff: "asc" } },
  });

  type PredictionWithMatch = typeof predictions[number];
  const scored = predictions.filter((p: PredictionWithMatch) => p.pointsAwarded !== null);
  const correct = scored.filter((p: PredictionWithMatch) => (p.pointsAwarded ?? 0) > 0);
  const accuracy = scored.length ? Math.round((correct.length / scored.length) * 100) : 0;

  const allUsers = await prisma.user.findMany({ select: { totalPoints: true } });
  const avg = allUsers.length
    ? Math.round(allUsers.reduce((a: number, u: { totalPoints: number }) => a + u.totalPoints, 0) / allUsers.length)
    : 0;
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });

  return NextResponse.json({
    totalPoints: me?.totalPoints ?? 0,
    groupAverage: avg,
    accuracy,
    totalPredictions: predictions.length,
    scoredPredictions: scored.length,
    history: predictions.map((p: PredictionWithMatch) => ({
      match: `${p.match.homeTeam} vs ${p.match.awayTeam}`,
      predicted: `${p.homeScore}-${p.awayScore}`,
      result: p.match.homeResult !== null ? `${p.match.homeResult}-${p.match.awayResult}` : null,
      points: p.pointsAwarded,
      boosted: p.boosted,
    })),
  });
}
