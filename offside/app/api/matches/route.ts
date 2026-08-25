import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const competition = req.nextUrl.searchParams.get("competition");
  const daysParam = req.nextUrl.searchParams.get("days");
  const pageParam = req.nextUrl.searchParams.get("page");

  // Parse and validate pagination parameters
  const days = daysParam ? Math.min(Math.max(1, Number(daysParam)), 365) : 60; // Limit days to 1-365
  const page = pageParam ? Math.max(0, Number(pageParam)) : 0; // Ensure page is not negative
  const MAX_PAGE = 50; // Limit to ~1 year of data (50 * 7 days)
  const pageSize = 7; // 7-days per page

  // Cap page to prevent excessive date calculations
  const cappedPage = Math.min(page, MAX_PAGE);

  const now = new Date();

  // Prevent potential overflow in date calculations
  const safeTimeOffset = Math.min(cappedPage * pageSize * 86400000, 8640000000); // Max ~100 days offset
  const windowStart = new Date(now.getTime() + safeTimeOffset);
  const windowEnd = new Date(now.getTime() + Math.min((cappedPage + 1) * pageSize * 86400000, 8640000000)); // Max ~100 days offset

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