import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const competition = req.nextUrl.searchParams.get("competition");
  const daysParam = req.nextUrl.searchParams.get("days");
  const days = daysParam ? Number(daysParam) : 14;

  const now = new Date();
  const windowEnd = new Date(now.getTime() + days * 86400000);

  const matches = await prisma.match.findMany({
    where: {
      ...(competition ? { competition } : {}),
      // Show the upcoming window plus anything still awaiting a result,
      // so a match doesn't just disappear the moment it's out of range.
      OR: [
        { kickoff: { gte: now, lte: windowEnd } },
        { AND: [{ kickoff: { lt: now } }, { homeResult: null }] },
      ],
    },
    orderBy: { kickoff: "asc" },
  });

  if (!session?.user?.id) return NextResponse.json(matches);

  const predictions = await prisma.prediction.findMany({ where: { userId: session.user.id } });
  const predMap = Object.fromEntries(predictions.map((p: typeof predictions[number]) => [p.matchId, p]));

  return NextResponse.json(matches.map((m: typeof matches[number]) => ({ ...m, userPrediction: predMap[m.id] ?? null })));
}
