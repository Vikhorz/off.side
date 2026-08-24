import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const competition = req.nextUrl.searchParams.get("competition");
  const daysParam = req.nextUrl.searchParams.get("days");
  const pageParam = req.nextUrl.searchParams.get("page");
  const days = daysParam ? Number(daysParam) : 60;
  const page = pageParam ? Number(pageParam) : 0;
  const pageSize = 7; // 7-days per page

  const now = new Date();
  const windowStart = new Date(now.getTime() + page * pageSize * 86400000);
  const windowEnd = new Date(now.getTime() + (page + 1) * pageSize * 86400000);

  const matches = await prisma.match.findMany({
    where: {
      ...(competition ? { competition } : {}),
      // Show matches in the current page window plus anything still awaiting a result,
      // so a match doesn't just disappear the moment it's out of range.
      OR: [
        { kickoff: { gte: windowStart, lte: windowEnd } },
        { AND: [{ kickoff: { lt: windowStart } }, { homeResult: null }] },
      ],
    },
    orderBy: { kickoff: "asc" },
  });

  if (!session?.user?.id) return NextResponse.json(matches);

  const predictions = await prisma.prediction.findMany({ where: { userId: session.user.id } });
  const predMap = Object.fromEntries(predictions.map((p: typeof predictions[number]) => [p.matchId, p]));

  return NextResponse.json(matches.map((m: typeof matches[number]) => ({ ...m, userPrediction: predMap[m.id] ?? null })));
}
