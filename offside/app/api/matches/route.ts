import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    console.log('API /matches: route called');

    const session = await auth();
    const competition = req.nextUrl.searchParams.get("competition");
    const daysParam = req.nextUrl.searchParams.get("days");
    const days = daysParam ? Number(daysParam) : 60;
    const pageParam = req.nextUrl.searchParams.get("page");
    const limitParam = req.nextUrl.searchParams.get("limit");
    const page = pageParam ? Math.max(0, Number(pageParam)) : 0;
    // 0 means no limit, otherwise use the provided limit (minimum 1)
    const limit = limitParam !== null ? Math.max(0, Number(limitParam)) : 0;

    const now = new Date();
    const windowEnd = new Date(now.getTime() + days * 86400000);

    const whereClause = {
      ...(competition ? { competition } : {}),
      // Show the upcoming window plus anything still awaiting a result,
      // so a match doesn't just disappear the moment it's out of range.
      OR: [
        { kickoff: { gte: now, lte: windowEnd } },
        { AND: [{ kickoff: { lt: now } }, { homeResult: null }] },
      ],
    };

    // Calculate skip and take for pagination (only if limit > 0)
    const skip = limit > 0 ? page * limit : undefined;
    const take = limit > 0 ? limit : undefined;

    const matches = await prisma.match.findMany({
      where: whereClause,
      orderBy: { kickoff: "asc" },
      ...(skip !== undefined && take !== undefined ? { skip, take } : {}),
    });

    // Log the number of matches fetched for debugging
    console.log(`API /matches: fetched ${matches.length} matches`);

    if (!session?.user?.id) {
      return NextResponse.json(matches);
    }

    const predictions = await prisma.prediction.findMany({ where: { userId: session.user.id } });
    const predMap = Object.fromEntries(predictions.map((p: typeof predictions[number]) => [p.matchId, p]));

    const enrichedMatches = matches.map((m: typeof matches[number]) => ({ ...m, userPrediction: predMap[m.id] ?? null }));
    console.log(`API /matches: returning ${enrichedMatches.length} matches with predictions`);

    return NextResponse.json(enrichedMatches);
  } catch (error) {
    console.error('API /matches: error occurred', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}