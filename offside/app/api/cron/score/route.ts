import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
