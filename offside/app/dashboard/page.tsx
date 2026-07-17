"use client";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { MatchCard } from "@/components/MatchCard";
import { Countdown } from "@/components/Countdown";
import { ActivityFeed } from "@/components/ActivityFeed";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const { data: matches, mutate } = useSWR("/api/matches", fetcher, { refreshInterval: 30000, revalidateOnFocus: false });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading" || !matches) {
    return (
      <div className="min-h-screen pb-16 sm:pb-0">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6 space-y-2">
          <div className="skeleton h-20 w-full mb-4" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-24 w-full" />
        </div>
      </div>
    );
  }

  const open = matches.filter((m: any) => new Date() < new Date(m.kickoff));
  const nextMatch = [...open].sort((a: any, b: any) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())[0];

  // Boost is a single token: find which match (if any) currently holds it.
  const boostHolder = matches.find((m: any) => m.userPrediction?.boosted);
  function boostAvailableFor(matchId: string) {
    if (!boostHolder) return true; // unassigned — available anywhere
    if (boostHolder.id === matchId) return true; // this match already holds it
    const holderLocked = new Date() >= new Date(boostHolder.kickoff);
    return !holderLocked; // available to reassign here only if the holder hasn't kicked off yet
  }

  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        {nextMatch && (
          <div className="mb-5">
            <Countdown
              target={nextMatch.kickoff}
              label={`Next: ${nextMatch.homeTeam} vs ${nextMatch.awayTeam}`}
            />
          </div>
        )}

        <div className="mb-4">
          <h2 className="font-grotesk text-lg font-medium text-warm">Upcoming matches</h2>
          <p className="text-xs text-steel mt-0.5">{open.length} predictions open</p>
        </div>
        {matches.length === 0 && (
          <p className="text-sm text-steel text-center py-8">No matches scheduled yet.</p>
        )}
        {matches.map((m: any) => (
          <MatchCard key={m.id} match={m} boostAvailable={boostAvailableFor(m.id)} onSaved={() => mutate()} />
        ))}

        <div className="mt-6">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
