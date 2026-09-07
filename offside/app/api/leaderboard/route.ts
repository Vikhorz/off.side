import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    // If not authenticated, return anonymized data
    if (!session) {
      const users = await prisma.user.findMany({
        orderBy: { totalPoints: "desc" },
        select: {
          id: true,
          totalPoints: true,
          predictions: {
            select: {
              pointsAwarded: true,
              match: {
                select: {
                  competition: true
                }
              }
            }
          }
        },
      });

      const leaderboard = users.map((u: typeof users[number], idx: number) => {
        // Calculate points by competition for anonymous users
        const pointsByCompetition: Record<string, number> = {};
        u.predictions.forEach((p: any) => {
          if (p.pointsAwarded !== null && p.match) {
            const comp = p.match.competition;
            pointsByCompetition[comp] = (pointsByCompetition[comp] || 0) + p.pointsAwarded;
          }
        });

        // Combine World Cup points with Premier League if present
        if (pointsByCompetition['WC']) {
          pointsByCompetition['PL'] = (pointsByCompetition['PL'] || 0) + pointsByCompetition['WC'];
          delete pointsByCompetition['WC'];
        }

        return {
          rank: idx + 1,
          username: `Tipster ${u.id}`, // Anonymous label using user ID
          totalPoints: u.totalPoints,
          predictions: u.predictions.length,
          scored: u.predictions.filter((p: { pointsAwarded: number | null }) => p.pointsAwarded !== null).length,
          pointsByCompetition,
        };
      });

      return NextResponse.json(leaderboard);
    }

    // If authenticated, return real data
    const users = await prisma.user.findMany({
      orderBy: { totalPoints: "desc" },
      select: {
        id: true,
        username: true,
        totalPoints: true,
        predictions: {
          select: {
            pointsAwarded: true,
            match: {
              select: {
                competition: true
              }
            }
          }
        },
      },
    });

    const leaderboard = users.map((u: typeof users[number], idx: number) => {
      // Calculate points by competition for authenticated users
      const pointsByCompetition: Record<string, number> = {};
      u.predictions.forEach((p: any) => {
        if (p.pointsAwarded !== null && p.match) {
          const comp = p.match.competition;
          pointsByCompetition[comp] = (pointsByCompetition[comp] || 0) + p.pointsAwarded;
        }
      });

      // Combine World Cup points with Premier League if present
      if (pointsByCompetition['WC']) {
        pointsByCompetition['PL'] = (pointsByCompetition['PL'] || 0) + pointsByCompetition['WC'];
        delete pointsByCompetition['WC'];
      }

      return {
        rank: idx + 1,
        username: u.username,
        totalPoints: u.totalPoints,
        predictions: u.predictions.length,
        scored: u.predictions.filter((p: { pointsAwarded: number | null }) => p.pointsAwarded !== null).length,
        pointsByCompetition,
      };
    });

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('API /leaderboard: error occurred', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
