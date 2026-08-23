"use client";
import useSWR from "swr";
import { Navbar } from "@/components/Navbar";
import { useI18n } from "@/lib/i18n";
import { useSession } from "next-auth/react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const medalStyles: Record<number, { bg: string; ring: string; label: string }> = {
  1: { bg: "bg-gradient-to-br from-amber-400/20 to-transparent", ring: "ring-1 ring-amber-400/40", label: "🥇" },
  2: { bg: "bg-gradient-to-br from-slate-300/15 to-transparent", ring: "ring-1 ring-slate-300/30", label: "🥈" },
  3: { bg: "bg-gradient-to-br from-orange-400/15 to-transparent", ring: "ring-1 ring-orange-400/30", label: "🥉" },
};

export default function LeaderboardPage() {
  const { t } = useI18n();
  const { data } = useSWR("/api/leaderboard", fetcher, { refreshInterval: 30000, revalidateOnFocus: false });
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const top3 = data?.slice(0, 3) ?? [];
  const rest = data?.slice(3) ?? [];

  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <h2 className="font-grotesk text-lg font-medium text-warm mb-4">{t("leaderboard.title")}</h2>

        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-indigo/5 rounded-xl border border-indigo/20">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center bg-indigo text-white text-xs font-medium rounded-full">
                🔒
              </div>
              <div className="text-sm font-medium text-warm">
                {t("leaderboard.loginToSee")}
              </div>
            </div>
          </div>
        )}

        {!data && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="skeleton h-24 w-full" />
              <div className="skeleton h-24 w-full" />
              <div className="skeleton h-24 w-full" />
            </div>
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        )}
        {data?.length === 0 && <p className="text-sm text-steel text-center py-8">{t("leaderboard.noPlayers")}</p>}

        {top3.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {top3.map((row: any) => {
              const style = medalStyles[row.rank] ?? medalStyles[3];
              return (
                <div key={row.username} className={`rounded-xl p-3 text-center border border-border ${style.bg} ${style.ring} rank-enter`}>
                  <div className="text-xl mb-1">{style.label}</div>
                  <div className="w-9 h-9 rounded-full bg-indigo-bg flex items-center justify-center text-[11px] font-medium text-indigo-mid mx-auto mb-1.5">
                    {isAuthenticated ? row.username.slice(0, 2).toUpperCase() : "??"}
                  </div>
                  <div className="text-xs font-medium text-warm truncate">
                    {isAuthenticated ? row.username : t("leaderboard.anonymous")}
                  </div>
                  <div className="font-mono text-sm font-medium text-indigo-mid mt-0.5">{row.totalPoints}</div>
                </div>
              );
            })}
          </div>
        )}

        {rest.length > 0 && (
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {rest.map((row: any) => (
              <div key={row.username} className="flex items-center gap-3 px-4 py-3 rank-enter">
                <span className="font-mono text-xs w-5 text-center text-steel">{row.rank}</span>
                <div className="w-7 h-7 rounded-full bg-indigo-bg flex items-center justify-center text-[10px] font-medium text-indigo-mid flex-shrink-0">
                  {isAuthenticated ? row.username.slice(0, 2).toUpperCase() : "??"}
                </div>
                <span className="text-sm font-medium text-warm flex-1">
                  {isAuthenticated ? row.username : t("leaderboard.anonymous")}
                </span>
                <span className="text-[11px] text-steel">{row.scored}/{row.predictions} {t("leaderboard.scored")}</span>
                <span className="font-mono text-sm font-medium text-indigo-mid">{row.totalPoints} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
