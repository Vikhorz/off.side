import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { totalPoints: "desc" },
    select: { id: true, username: true, totalPoints: true, predictions: { select: { pointsAwarded: true } } },
  });

  const leaderboard = users.map((u: typeof users[number], idx: number) => ({
    rank: idx + 1,
    username: u.username,
    totalPoints: u.totalPoints,
    predictions: u.predictions.length,
    scored: u.predictions.filter((p: { pointsAwarded: number | null }) => p.pointsAwarded !== null).length,
  }));

  return NextResponse.json(leaderboard);
}
