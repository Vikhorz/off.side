import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getIsoWeekKey } from "@/lib/week";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const predictions = await prisma.prediction.findMany({
      where: { userId: session.user.id },
      include: { match: true },
    });
    return NextResponse.json(predictions);
  } catch (error) {
    console.error('API /predictions GET: error occurred', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { matchId, homeScore, awayScore, boosted } = await req.json();

    if (typeof homeScore !== "number" || typeof awayScore !== "number")
      return NextResponse.json({ error: "Invalid score values" }, { status: 400 });
    if (homeScore < 0 || homeScore > 20 || awayScore < 0 || awayScore > 20)
      return NextResponse.json({ error: "Score out of range" }, { status: 400 });

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    if (new Date() >= match.kickoff)
      return NextResponse.json({ error: "Prediction window closed" }, { status: 403 });

    const weekKey = getIsoWeekKey(match.kickoff);

    // One boost token per user per calendar week (Mon-Sun). Reassignable
    // between matches within the SAME week; locked in permanently once its
    // holder match kicks off — same rules as before, just re-scoped per week.
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let validatedBoosted = false;

      if (boosted === true) {
        const allowance = await tx.weeklyBoost.findUnique({
          where: { userId_weekKey: { userId: session.user.id, weekKey } },
        });

        if (!allowance || !allowance.matchId || allowance.matchId === matchId) {
          validatedBoosted = true;
          await tx.weeklyBoost.upsert({
            where: { userId_weekKey: { userId: session.user.id, weekKey } },
            update: { matchId },
            create: { userId: session.user.id, weekKey, matchId },
          });
        } else {
          const holderMatch = await tx.match.findUnique({ where: { id: allowance.matchId } });
          const holderLocked = holderMatch ? new Date() >= holderMatch.kickoff : false;
          if (!holderLocked) {
            await tx.prediction.updateMany({
              where: { userId: session.user.id, matchId: allowance.matchId },
              data: { boosted: false },
            });
            await tx.weeklyBoost.update({
              where: { userId_weekKey: { userId: session.user.id, weekKey } },
              data: { matchId },
            });
            validatedBoosted = true;
          }
          // else: this week's boost already permanently spent on the locked holder match
        }
      } else {
        const allowance = await tx.weeklyBoost.findUnique({
          where: { userId_weekKey: { userId: session.user.id, weekKey } },
        });
        if (allowance?.matchId === matchId) {
          await tx.weeklyBoost.update({
            where: { userId_weekKey: { userId: session.user.id, weekKey } },
            data: { matchId: null },
          });
        }
      }

      const prediction = await tx.prediction.upsert({
        where: { userId_matchId: { userId: session.user.id, matchId } },
        update: { homeScore, awayScore, boosted: validatedBoosted, submittedAt: new Date() },
        create: { userId: session.user.id, matchId, homeScore, awayScore, boosted: validatedBoosted },
      });

      return prediction;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API /predictions POST: error occurred', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
