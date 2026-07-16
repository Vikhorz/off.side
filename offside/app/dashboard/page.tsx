"use client";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { MatchCard } from "@/components/MatchCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const { data: matches, mutate } = useSWR("/api/matches", fetcher, { refreshInterval: 30000 });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading" || !matches) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-8 text-center text-steel text-sm">Loading matches…</div>
      </div>
    );
  }

  const open = matches.filter((m: any) => new Date() < new Date(m.kickoff));
  const boostAvailable = true; // derived server-side per-round on save; UI shows optimistic true

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-4">
          <h2 className="font-grotesk text-lg font-medium text-warm">Upcoming matches</h2>
          <p className="text-xs text-steel mt-0.5">{open.length} predictions open</p>
        </div>
        {matches.length === 0 && (
          <p className="text-sm text-steel text-center py-8">No matches scheduled yet.</p>
        )}
        {matches.map((m: any) => (
          <MatchCard key={m.id} match={m} boostAvailable={boostAvailable} onSaved={() => mutate()} />
        ))}
      </div>
    </div>
  );
}
