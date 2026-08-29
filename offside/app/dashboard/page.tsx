"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { MatchCard } from "@/components/MatchCard";
import { Countdown } from "@/components/Countdown";
import { ActivityFeed } from "@/components/ActivityFeed";
import ActivityFeedPreview from "@/components/ActivityFeedPreview";
import { useI18n } from "@/lib/i18n";
import { getIsoWeekKey } from "@/lib/week";
import { COMPETITIONS } from "@/lib/competitions";

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [competition, setCompetition] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(0);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [status, router]);

  // Reset page when competition or showAll changes
  useEffect(() => {
    setPage(0);
  }, [competition, showAll]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', showAll ? '0' : '7'); // 0 means no limit
      if (competition) {
        params.append('competition', competition);
      }
      const res = await fetch(`/api/matches?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [competition, showAll, page]);

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen pb-16 sm:pb-0">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-6">
          <p className="text-center text-coral-mid">{error}</p>
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
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors ${competition === null ? "bg-indigo-bg border-indigo text-indigo-mid" : "border-border text-steel"}`}
          >
            All
          </button>
          {COMPETITIONS.map((c) => (
            <button
              key={c.code}
              onClick={() => setCompetition(c.code)}
              className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors ${competition === c.code ? "bg-indigo-bg border-indigo text-indigo-mid" : "border-border text-steel"}`}
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
            <MatchCard key={m.id} match={m} boostAvailable={boostAvailableFor(m)} onSaved={() => {
              // Refetch after saving
              setPage(0); // Reset to first page after saving to refetch
              fetchMatches();
            }} />
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

        {!showAll && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className={`px-3 py-1.5 rounded-md border border-border text-sm ${page === 0 ? "opacity-40 cursor-not-allowed" : "hover:bg-indigo/10"}`
            }
            >
              {t("dashboard.previous")}
            </button>
            <span className="text-sm text-steel">
              Page {page + 1} of {Math.ceil(matches.length / 7)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * 7 >= matches.length}
              className={`px-3 py-1.5 rounded-md border border-border text-sm ${(page + 1) * 7 >= matches.length ? "opacity-40 cursor-not-allowed" : "hover:bg-indigo/10"}`
            }
            >
              {t("dashboard.next")}
            </button>
          </div>
        )}

        <div className="mt-6">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}