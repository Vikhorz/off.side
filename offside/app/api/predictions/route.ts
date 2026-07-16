import { NextRequest, NextResponse } from "next/server";
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

  // Validate types
  if (typeof homeScore !== "number" || typeof awayScore !== "number")
    return NextResponse.json({ error: "Invalid score values" }, { status: 400 });
  if (homeScore < 0 || homeScore > 20 || awayScore < 0 || awayScore > 20)
    return NextResponse.json({ error: "Score out of range" }, { status: 400 });

  // SERVER-SIDE: Check match exists and kickoff hasn't passed
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (new Date() >= match.kickoff)
    return NextResponse.json({ error: "Prediction window closed" }, { status: 403 });

  // SERVER-SIDE: Validate boost from DB — never trust client
  let validatedBoosted = false;
  if (boosted === true) {
    const round = match.group.startsWith("Group") ? "group-week-1" : "round-of-16"; // simplified; extend per round logic
    const allowance = await prisma.boostAllowance.findUnique({
      where: { userId_round: { userId: session.user.id, round } },
    });
    if (allowance && !allowance.used) {
      validatedBoosted = true;
      await prisma.boostAllowance.update({
        where: { userId_round: { userId: session.user.id, round } },
        data: { used: true, usedAt: new Date() },
      });
    }
  }

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    update: { homeScore, awayScore, boosted: validatedBoosted, submittedAt: new Date() },
    create: { userId: session.user.id, matchId, homeScore, awayScore, boosted: validatedBoosted },
  });

  return NextResponse.json(prediction);
}
