import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LandingContent } from "@/components/LandingContent";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  const nextMatch = await prisma.match.findFirst({
    where: { kickoff: { gt: new Date() } },
    orderBy: { kickoff: "asc" },
  });

  return (
    <LandingContent
      nextMatch={nextMatch ? { homeTeam: nextMatch.homeTeam, awayTeam: nextMatch.awayTeam, kickoff: nextMatch.kickoff.toISOString() } : null}
    />
  );
}
