import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Countdown } from "@/components/Countdown";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  const nextMatch = await prisma.match.findFirst({
    where: { kickoff: { gt: new Date() } },
    orderBy: { kickoff: "asc" },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-grotesk text-5xl font-bold text-warm tracking-tight">
          Off<span className="text-indigo">.</span>side
        </h1>
        <p className="text-xs text-steel mt-3 uppercase tracking-wide">
          World Cup 2026 · Prediction League
        </p>

        {nextMatch && (
          <div className="mt-8">
            <Countdown
              target={nextMatch.kickoff.toISOString()}
              label={`Next: ${nextMatch.homeTeam} vs ${nextMatch.awayTeam}`}
            />
          </div>
        )}

        <div className="mt-8 grid grid-cols-3 gap-2 text-left">
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="text-lg mb-1">🎯</div>
            <div className="text-[11px] text-warm font-medium leading-tight">Score predictions</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="text-lg mb-1">⚡</div>
            <div className="text-[11px] text-warm font-medium leading-tight">One boost per round</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="text-lg mb-1">🛡️</div>
            <div className="text-[11px] text-warm font-medium leading-tight">Tamper-proof scoring</div>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <Link
            href="/register"
            className="block w-full bg-indigo text-white text-sm font-medium py-2.5 rounded-md hover:bg-indigo/90 transition-colors"
          >
            Join the league
          </Link>
          <Link
            href="/login"
            className="block w-full text-steel text-sm py-2.5 hover:text-warm transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
