"use client";
import useSWR from "swr";
import { useI18n } from "@/lib/i18n";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function LeaderboardPreview() {
  const { t } = useI18n();
  const { data } = useSWR("/api/leaderboard", fetcher, { refreshInterval: 30000 });

  const top3 = data?.slice(0, 3) ?? [];

  return (
    <div className="space-y-3">
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {top3.map((row: any) => (
            <div key={row.username} className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl">
              <div className="flex h-9 w-9 items-center justify-center bg-indigo text-white text-xs font-medium rounded-full">
                ??
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-warm">{t("leaderboard.anonymous")}</div>
                <div className="font-mono text-sm font-medium text-indigo-mid">{row.totalPoints}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {top3.length === 0 && (
        <p className="text-sm text-steel text-center py-6">{t("leaderboard.noPlayers")}</p>
      )}

      {/* Call to action */}
      <div className="mt-4 text-center">
        <a
          href="/login"
          className="text-sm font-medium text-indigo hover:text-indigo/90 transition-colors"
        >
          {t("leaderboard.loginToSeeFull")}
        </a>
      </div>
    </div>
  );
}