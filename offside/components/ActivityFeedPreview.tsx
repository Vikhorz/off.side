"use client";
import useSWR from "swr";
import { useI18n } from "@/lib/i18n";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ActivityFeedPreview() {
  const { t } = useI18n();
  const { data } = useSWR("/api/activity", fetcher, { refreshInterval: 20000 });

  return (
    <div>
      {!data && <p className="text-xs text-steel text-center py-4">Loading…</p>}
      {data?.length === 0 && <p className="text-xs text-steel text-center py-4">{t("activity.empty")}</p>}
      {data?.map((item: any, i: number) => (
        <div key={i} className="px-4 py-2.5 text-xs border-b border-border last:border-0">
          <span className="text-warm font-medium">Tipster ???</span>
          <span className="text-steel"> {t("activity.predicted")} </span>
          <span className="text-warm">{item.match}</span>
          {item.boosted && <span className="text-indigo-mid"> · {t("activity.boosted")}</span>}
          {item.revealed && item.prediction && (
            <span className="text-indigo-mid font-mono"> → ???</span>
          )}
          <div className="text-[10px] text-steel mt-0.5">{timeAgo(item.submittedAt)}</div>
        </div>
      ))}
    </div>
  );
}