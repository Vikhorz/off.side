import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  // If not authenticated, return anonymized data
  if (!session) {
    const users = await prisma.user.findMany({
      orderBy: { totalPoints: "desc" },
      select: { id: true, totalPoints: true, predictions: { select: { pointsAwarded: true } } },
    });

    const leaderboard = users.map((u: typeof users[number], idx: number) => ({
      rank: idx + 1,
      username: `Tipster ${u.id}`, // Anonymous label using user ID
      totalPoints: u.totalPoints,
      predictions: u.predictions.length,
      scored: u.predictions.filter((p: { pointsAwarded: number | null }) => p.pointsAwarded !== null).length,
    }));

    return NextResponse.json(leaderboard);
  }

  // If authenticated, return real data
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
