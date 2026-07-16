import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const matches = await prisma.match.findMany({ orderBy: { kickoff: "asc" } });

  if (!session?.user?.id) return NextResponse.json(matches);

  const predictions = await prisma.prediction.findMany({ where: { userId: session.user.id } });
  const predMap = Object.fromEntries(predictions.map((p: typeof predictions[number]) => [p.matchId, p]));

  return NextResponse.json(matches.map((m: typeof matches[number]) => ({ ...m, userPrediction: predMap[m.id] ?? null })));
}
