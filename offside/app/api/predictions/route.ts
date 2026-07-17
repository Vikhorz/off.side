import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const predictions = await prisma.prediction.findMany({
    where: { userId: session.user.id },
    include: { match: true },
  });
  return NextResponse.json(predictions);
}

export async function POST(req: NextRequest) {
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

  // Single reassignable boost token per user (User.boostMatchId), never trusting
  // the client's `boosted` field directly:
  //  - if the token is unassigned, or already assigned to THIS match -> allow.
  //  - if it's assigned to a DIFFERENT match that hasn't kicked off yet -> move it here,
  //    and clear the boosted flag on that other match's prediction.
  //  - if it's assigned to a DIFFERENT match that has already kicked off -> permanently
  //    spent there; reject boosted:true for this match.
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.findUnique({ where: { id: session.user.id } });
    let validatedBoosted = false;

    if (boosted === true) {
      if (!user?.boostMatchId || user.boostMatchId === matchId) {
        validatedBoosted = true;
        await tx.user.update({ where: { id: session.user.id }, data: { boostMatchId: matchId } });
      } else {
        const holderMatch = await tx.match.findUnique({ where: { id: user.boostMatchId } });
        const holderLocked = holderMatch ? new Date() >= holderMatch.kickoff : false;
        if (!holderLocked) {
          // reassign: free the old holder's prediction, move token here
          await tx.prediction.updateMany({
            where: { userId: session.user.id, matchId: user.boostMatchId },
            data: { boosted: false },
          });
          await tx.user.update({ where: { id: session.user.id }, data: { boostMatchId: matchId } });
          validatedBoosted = true;
        }
        // else: boost permanently spent on the locked holder match — stays false here
      }
    } else if (user?.boostMatchId === matchId) {
      // explicitly cancelling boost on the match that currently holds it
      await tx.user.update({ where: { id: session.user.id }, data: { boostMatchId: null } });
    }

    const prediction = await tx.prediction.upsert({
      where: { userId_matchId: { userId: session.user.id, matchId } },
      update: { homeScore, awayScore, boosted: validatedBoosted, submittedAt: new Date() },
      create: { userId: session.user.id, matchId, homeScore, awayScore, boosted: validatedBoosted },
    });

    return prediction;
  });

  return NextResponse.json(result);
}
