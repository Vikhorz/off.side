import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type CompetitionStats = {
  points: number;
  predictions: number;
  scored: number;
};

type LeaderboardPrediction = {
  pointsAwarded: number | null;
  match: { competition: string } | null;
};

type LeaderboardUser = {
  id: string;
  username: string;
  totalPoints: number;
  predictions: LeaderboardPrediction[];
};

function getCompetitionStats(predictions: LeaderboardPrediction[]): Record<string, CompetitionStats> {
  const stats: Record<string, CompetitionStats> = {};

  predictions.forEach((prediction) => {
    if (!prediction.match) return;
    const competition = prediction.match.competition === "WC" ? "PL" : prediction.match.competition;
    const current = stats[competition] ?? { points: 0, predictions: 0, scored: 0 };
    current.predictions += 1;
    if (prediction.pointsAwarded !== null) {
      current.points += prediction.pointsAwarded;
      current.scored += 1;
    }
    stats[competition] = current;
  });

  return stats;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const competition = request.nextUrl.searchParams.get("competition");
    const users: LeaderboardUser[] = await prisma.user.findMany({
      orderBy: { totalPoints: "desc" },
      select: {
        id: true,
        username: true,
        totalPoints: true,
        predictions: {
          select: {
            pointsAwarded: true,
            match: {
              select: { competition: true },
            },
          },
        },
      },
    });

    const leaderboard = users
      .map((user: LeaderboardUser) => {
        const competitionStats = getCompetitionStats(user.predictions);
        const selectedStats = competition
          ? competitionStats[competition] ?? { points: 0, predictions: 0, scored: 0 }
          : null;

        return {
          username: session ? user.username : `Tipster ${user.id}`,
          totalPoints: selectedStats ? selectedStats.points : user.totalPoints,
          predictions: selectedStats ? selectedStats.predictions : user.predictions.length,
          scored: selectedStats
            ? selectedStats.scored
            : user.predictions.filter((prediction: LeaderboardPrediction) => prediction.pointsAwarded !== null).length,
          pointsByCompetition: Object.fromEntries(
            Object.entries(competitionStats).map(([code, stats]) => [code, stats.points]),
          ),
        };
      })
      .sort((a: { totalPoints: number; username: string }, b: { totalPoints: number; username: string }) =>
        b.totalPoints - a.totalPoints || a.username.localeCompare(b.username))
      .map((row: Omit<LeaderboardUser, "id" | "predictions"> & {
        predictions: number;
        scored: number;
        pointsByCompetition: Record<string, number>;
      }, index: number) => ({ rank: index + 1, ...row }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('API /leaderboard: error occurred', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
