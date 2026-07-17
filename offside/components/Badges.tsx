"use client";

type HistoryItem = { predicted: string; result: string | null; points: number | null; boosted: boolean };

function computeBadges(history: HistoryItem[]) {
  const scored = history.filter((h) => h.points !== null);
  const badges: { icon: string; label: string; earned: boolean; desc: string }[] = [];

  const perfectCount = scored.filter((h) => h.points === 5 || h.points === 10).length;
  badges.push({
    icon: "🎯", label: "Perfect Predictor", earned: perfectCount > 0,
    desc: perfectCount > 0 ? `${perfectCount} exact score${perfectCount > 1 ? "s" : ""} called` : "Nail an exact scoreline",
  });

  const boostWins = scored.filter((h) => h.boosted && (h.points ?? 0) > 0).length;
  badges.push({
    icon: "⚡", label: "Boost Specialist", earned: boostWins > 0,
    desc: boostWins > 0 ? `${boostWins} boosted prediction${boostWins > 1 ? "s" : ""} paid off` : "Land a correct boosted call",
  });

  const streak = (() => {
    let max = 0, cur = 0;
    for (const h of scored) {
      if ((h.points ?? 0) > 0) { cur++; max = Math.max(max, cur); } else cur = 0;
    }
    return max;
  })();
  badges.push({
    icon: "🔥", label: "On a Streak", earned: streak >= 2,
    desc: streak >= 2 ? `${streak} correct in a row` : "Get 2+ correct predictions in a row",
  });

  badges.push({
    icon: "🥇", label: "Full House", earned: history.length > 0 && scored.length === history.length && scored.every((h) => (h.points ?? 0) > 0),
    desc: "Every single prediction scored so far is correct",
  });

  return badges;
}

export function Badges({ history }: { history: HistoryItem[] }) {
  const badges = computeBadges(history);
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {badges.map((b) => (
        <div
          key={b.label}
          className={`rounded-xl p-3 border ${b.earned ? "bg-indigo-bg border-indigo" : "bg-card border-border opacity-50"}`}
        >
          <div className="text-lg mb-1">{b.icon}</div>
          <div className={`text-xs font-medium ${b.earned ? "text-indigo-mid" : "text-steel"}`}>{b.label}</div>
          <div className="text-[10px] text-steel mt-0.5 leading-tight">{b.desc}</div>
        </div>
      ))}
    </div>
  );
}
