"use client";
import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { MatchCard } from "@/components/MatchCard";
import { Countdown } from "@/components/Countdown";
import { ActivityFeed } from "@/components/ActivityFeed";
import LeaderboardPreview from "@/components/LeaderboardPreview";
import ActivityFeedPreview from "@/components/ActivityFeedPreview";
import { useI18n } from "@/lib/i18n";
import { getIsoWeekKey } from "@/lib/week";
import { COMPETITIONS } from "@/lib/competitions";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [competition, setCompetition] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data: matches, mutate } = useSWR(
    `/api/matches${competition ? `?competition=${competition}` : ""}`,
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading" || !matches) {
    return (
      <div className="min-h-screen pb-16 sm:pb-0">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6 space-y-2">
          <div className="skeleton h-20 w-full mb-4" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-24 w-full" />
        </div>
      </div>
    );
  }

  const open = matches.filter((m: any) => new Date() < new Date(m.kickoff));
  const nextMatch = [...open].sort((a: any, b: any) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())[0];

  // Boost is one token per calendar week — find the holder within the SAME
  // week as the match being checked, not globally across the whole season.
  function boostAvailableFor(match: any) {
    const weekKey = getIsoWeekKey(new Date(match.kickoff));
    const holder = matches.find(
      (m: any) => m.userPrediction?.boosted && getIsoWeekKey(new Date(m.kickoff)) === weekKey
    );
    if (!holder) return true;
    if (holder.id === match.id) return true;
    const holderLocked = new Date() >= new Date(holder.kickoff);
    return !holderLocked;
  }

  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        {nextMatch && (
          <div className="mb-5">
            <Countdown
              target={nextMatch.kickoff}
              label={`${t("landing.next")}: ${nextMatch.homeTeam} vs ${nextMatch.awayTeam}`}
            />
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setCompetition(null)}
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors ${
              competition === null ? "bg-indigo-bg border-indigo text-indigo-mid" : "border-border text-steel"
            }`}
          >
            All
          </button>
          {COMPETITIONS.map((c) => (
            <button
              key={c.code}
              onClick={() => setCompetition(c.code)}
              className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors ${
                competition === c.code ? "bg-indigo-bg border-indigo text-indigo-mid" : "border-border text-steel"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <h2 className="font-grotesk text-lg font-medium text-warm">{t("dashboard.title")}</h2>
          <p className="text-xs text-steel mt-0.5">{open.length} {t("dashboard.openCount")}</p>
        </div>
        {matches.length === 0 && (
          <p className="text-sm text-steel text-center py-8">{t("dashboard.noMatches")}</p>
        )}
        <div className="relative">
          {(showAll ? matches : matches.slice(0, 7)).map((m: any) => (
            <MatchCard key={m.id} match={m} boostAvailable={boostAvailableFor(m)} onSaved={() => mutate()} />
          ))}
          {!showAll && matches.length > 7 && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-navy to-transparent pointer-events-none" />
          )}
        </div>
        {!showAll && matches.length > 7 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-sm text-indigo-mid py-2 -mt-4 relative"
          >
            {t("dashboard.showMore")}
          </button>
        )}

        <div className="mt-6">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
