"use client";
import useSWR from "swr";
import { Navbar } from "@/components/Navbar";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StatsPage() {
  const { data } = useSWR("/api/stats", fetcher);

  if (!data) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-8 text-center text-steel text-sm">Loading…</div>
      </div>
    );
  }

  const chartData = [
    { name: "You", points: data.totalPoints },
    { name: "Group avg", points: data.groupAverage },
  ];

  return (
    <div className="min-h-screen">
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

        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="text-xs text-steel mb-3">You vs group average</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2F42" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#8A9BAB", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8A9BAB", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0F1B2D", border: "1px solid #1E2F42", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="points" fill="#5B6EF5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
