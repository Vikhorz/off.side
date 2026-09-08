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

function getVisibleCompetitionPoints(pointsByCompetition: Record<string, number> = {}) {
  const visiblePoints = { ...pointsByCompetition };

  if (Object.prototype.hasOwnProperty.call(visiblePoints, "WC")) {
    visiblePoints.PL = (visiblePoints.PL || 0) + visiblePoints.WC;
    delete visiblePoints.WC;
  }

  return visiblePoints;
}

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
          <div className="grid grid-cols-3 items-end gap-2 mb-4">
            {top3.map((row: any) => {
              const pointsByCompetition = getVisibleCompetitionPoints(row.pointsByCompetition);

              const style = medalStyles[row.rank] ?? medalStyles[3];
              return (
                <div key={row.username} className={`relative min-w-0 rounded-xl p-2.5 sm:p-3 text-center border border-border bg-card ${style.bg} ${style.ring} ${row.rank === 1 ? "-translate-y-1" : ""} rank-enter`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-steel">#{row.rank}</span>
                    <span className="text-base sm:text-lg leading-none">{style.label}</span>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-bg flex items-center justify-center text-[10px] sm:text-[11px] font-medium text-indigo-mid mx-auto mb-2">
                    {isAuthenticated ? row.username.slice(0, 2).toUpperCase() : "??"}
                  </div>
                  <div className="text-[11px] sm:text-xs font-medium text-warm truncate min-h-4">
                    {isAuthenticated ? row.username : t("leaderboard.anonymous")}
                  </div>
                  <div className="font-mono text-base sm:text-lg font-medium text-indigo-mid mt-2 leading-tight">{row.totalPoints} pts</div>
                  <div className="text-[9px] sm:text-[10px] text-steel mt-1 whitespace-nowrap">
                    {row.scored}/{row.predictions} {t("leaderboard.scored")}
                  </div>

                  {/* Points by League for top 3 */}
                  {pointsByCompetition && Object.keys(pointsByCompetition).length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] sm:text-[10px] text-steel text-left">
                      {Object.entries(pointsByCompetition).map(([competition, points]) => (
                        <div key={competition} className="flex min-w-0 items-center justify-between gap-1">
                          <span className="font-mono truncate">{competition}:</span>
                          <span className="font-mono text-indigo-mid">{points}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {rest.length > 0 && (
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {rest.map((row: any) => {
              const pointsByCompetition = getVisibleCompetitionPoints(row.pointsByCompetition);

              return (
                <div key={row.username} className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-x-2 sm:gap-x-3 gap-y-1 px-3 sm:px-4 py-3 rank-enter">
                  <span className="font-mono text-xs w-5 text-center text-steel">{row.rank}</span>
                  <div className="w-7 h-7 rounded-full bg-indigo-bg flex items-center justify-center text-[10px] font-medium text-indigo-mid flex-shrink-0">
                    {isAuthenticated ? row.username.slice(0, 2).toUpperCase() : "??"}
                  </div>
                  <span className="min-w-0 truncate text-xs sm:text-sm font-medium text-warm">
                    {isAuthenticated ? row.username : t("leaderboard.anonymous")}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-steel whitespace-nowrap">{row.scored}/{row.predictions} {t("leaderboard.scored")}</span>
                  <span className="font-mono text-sm sm:text-base font-medium text-indigo-mid whitespace-nowrap">{row.totalPoints} pts</span>

                  {/* Points by League for rest */}
                  {pointsByCompetition && Object.keys(pointsByCompetition).length > 0 && (
                    <div className="col-span-5 ml-10 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-steel">
                      {Object.entries(pointsByCompetition).map(([competition, points]) => (
                        <div key={competition} className="flex items-center">
                          <span className="mr-1 font-mono">{competition}:</span>
                          <span className="font-mono text-indigo-mid">{points}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
