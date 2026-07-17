"use client";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { Badges } from "@/components/Badges";

// Code-split recharts out of the initial bundle — only loaded when the stats
// page actually renders a chart, not shipped to every route.
const PointsChart = dynamic(() => import("@/components/PointsChart").then((m) => m.PointsChart), {
  ssr: false,
  loading: () => <div className="skeleton h-[140px] w-full" />,
});

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StatsPage() {
  const { data } = useSWR("/api/stats", fetcher, { revalidateOnFocus: false });

  if (!data) {
    return (
      <div className="min-h-screen pb-16 sm:pb-0">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-20 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-16 w-full" />
          </div>
          <div className="skeleton h-[140px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        <h2 className="font-grotesk text-lg font-medium text-warm mb-4">My stats</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-mono font-medium text-indigo-mid">{data.totalPoints}</div>
            <div className="text-[11px] text-steel mt-1">Total points</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-mono font-medium text-warm">{data.accuracy}%</div>
            <div className="text-[11px] text-steel mt-1">Prediction accuracy</div>
          </div>
        </div>

        <Badges history={data.history} />

        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="text-xs text-steel mb-3">You vs group average</div>
          <PointsChart you={data.totalPoints} groupAverage={data.groupAverage} />
        </div>

        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          <div className="px-4 py-2.5 text-xs text-steel">Prediction history</div>
          {data.history.length === 0 && <p className="text-sm text-steel text-center py-8">No predictions yet.</p>}
          {data.history.map((h: any, i: number) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <div className="text-xs text-warm">{h.match}</div>
                <div className="text-[10px] text-steel mt-0.5">
                  Predicted {h.predicted}{h.result ? ` · Result ${h.result}` : " · Upcoming"}
                  {h.boosted && <span className="text-indigo-mid"> · Boosted</span>}
                </div>
              </div>
              {h.points !== null && (
                <span className="font-mono text-xs text-indigo-mid">+{h.points}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
