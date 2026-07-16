"use client";
import useSWR from "swr";
import { Navbar } from "@/components/Navbar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function LeaderboardPage() {
  const { data } = useSWR("/api/leaderboard", fetcher, { refreshInterval: 30000 });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <h2 className="font-grotesk text-lg font-medium text-warm mb-4">Leaderboard</h2>
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {!data && <p className="text-sm text-steel text-center py-8">Loading…</p>}
          {data?.length === 0 && <p className="text-sm text-steel text-center py-8">No players yet.</p>}
          {data?.map((row: any) => (
            <div key={row.username} className="flex items-center gap-3 px-4 py-3 rank-enter">
              <span className={`font-mono text-xs w-5 text-center ${row.rank === 1 ? "text-amber-400 font-medium" : "text-steel"}`}>
                {row.rank}
              </span>
              <div className="w-7 h-7 rounded-full bg-indigo-bg flex items-center justify-center text-[10px] font-medium text-indigo-mid flex-shrink-0">
                {row.username.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-warm flex-1">{row.username}</span>
              <span className="text-[11px] text-steel">{row.scored}/{row.predictions} scored</span>
              <span className="font-mono text-sm font-medium text-indigo-mid">{row.totalPoints} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
