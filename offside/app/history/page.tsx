"use client";
import useSWR from "swr";
import { Navbar } from "@/components/Navbar";
import { useI18n } from "@/lib/i18n";
import { COMPETITIONS } from "@/lib/competitions";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HistoryPage() {
  const { t } = useI18n();
  const { data } = useSWR("/api/history", fetcher, { revalidateOnFocus: false });

  function competitionLabel(code: string) {
    return COMPETITIONS.find((c) => c.code === code)?.label ?? code;
  }

  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <h2 className="font-grotesk text-lg font-medium text-warm mb-1">{t("history.title")}</h2>
        <p className="text-xs text-steel mb-4">{t("history.subtitle")}</p>

        {!data && (
          <div className="space-y-2">
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-16 w-full" />
          </div>
        )}
        {data?.length === 0 && <p className="text-sm text-steel text-center py-8">{t("history.empty")}</p>}

        {data?.length > 0 && (
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {data.map((row: any) => (
              <div key={row.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-warm">{competitionLabel(row.competition)}</div>
                  <div className="text-[11px] text-steel mt-0.5">{row.seasonLabel}</div>
                </div>
                <span className="font-mono text-sm font-medium text-indigo-mid">{row.points} {t("history.points")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
