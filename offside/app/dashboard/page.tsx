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
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data: matches, isLoading, error, mutate } = useSWR(
    buildMatchesUrl(competition, page),
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
      // Don't refetch automatically when page changes to prevent infinite loops
      dedupingInterval: 30000,
      // Retry failed requests up to 3 times
      retryCount: 3
    }
  );

// Helper function to build the matches API URL
function buildMatchesUrl(competition: string | null, page: number): string {
  let url = '/api/matches';

  // Add competition parameter if provided
  if (competition) {
    url += `?competition=${competition}`;
  }

  // Add page parameter if page > 0
  if (page > 0) {
    url += competition ? `&page=${page}` : `?page=${page}`;
  }

  return url;
}

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Handle loading and error states
  if (isLoading && !matches) {
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
        <div className="max-w-lg mx-auto px-4 py-6 text-center">
          <p className="text-coral-mid">Failed to load matches. Please try again later.</p>
          <button
            onClick={() => mutate()}
            className="text-indigo-mid hover:text-indigo-bg underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Ensure we have matches data before processing
  let open: any[] = [];
  let nextMatch: any | null = null;
  if (isLoading) {
    open = [];
    nextMatch = null;
  } else {
    open = matches.filter((m: any) => new Date() < new Date(m.kickoff));
    nextMatch = [...open].sort((a: any, b: any) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())[0];
  }

  // Boost is one token per calendar week — find the holder within the SAME
  // week as the match being checked, not globally across the whole season.
  function boostAvailableFor(match: any) {
    // Guard against missing matches data
    if (!matches || matches.length === 0) return true;

    const weekKey = getIsoWeekKey(new Date(match.kickoff));
    const holder = matches.find(
      (m: any) => m.userPrediction?.boosted && getIsoWeekKey(new Date(m.kickoff)) === weekKey
    );
    if (!holder) return true;
    if (holder.id === match.id) return true;
    const holderLocked = new Date() >= new Date(holder.kickoff);
    return !holderLocked;
  }

  // Calculate max reasonable page based on current date to avoid overflow
  // Assuming we don't need to show matches more than 2 years in the future/past
  const MAX_REASONABLE_PAGE = 104; // ~2 years * 52 weeks / 7 days per page

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
            onClick={() => {
              setCompetition(null);
              setPage(0);
            }}
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors ${
              competition === null ? "bg-indigo-bg border-indigo text-indigo-mid" : "border-border text-steel"
            }`}
          >
            All
          </button>
          {COMPETITIONS.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setCompetition(c.code);
                setPage(0);
              }}
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
          {matches.map((m: any) => (
            <MatchCard key={m.id} match={m} boostAvailable={boostAvailableFor(m)} onSaved={() => mutate()} />
          ))}
          {matches.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-navy to-transparent pointer-events-none" />
          )}
        </div>
        <div className="flex justify-between items-center mt-4">
          {/* Prevent going below page 0 or beyond reasonable limit */}
          <button
            onClick={() => {
              const newPage = Math.max(0, page - 1);
              if (newPage !== page) {
                setPage(newPage);
              }
            }}
            disabled={page === 0 || loadingMore}
            className={`text-sm text-indigo-mid py-2 px-4 ${page === 0 || loadingMore ? "opacity-50" : ""}`}
          >
            {t("dashboard.previous")}
          </button>
          <span className="text-xs text-steel">
            Page {page + 1}
          </span>
          {/* Prevent going beyond reasonable page limit */}
          <button
            onClick={() => {
              const newPage = page + 1;
              // Only allow page change if within reasonable bounds
              if (newPage <= MAX_REASONABLE_PAGE && newPage !== page) {
                setLoadingMore(true);
                setPage(newPage);
                // Reset loading state after a short delay to prevent rapid firing
                setTimeout(() => setLoadingMore(false), 1000);
              }
            }}
            disabled={page >= MAX_REASONABLE_PAGE || loadingMore}
            className={`text-sm text-indigo-mid py-2 px-4 ${page >= MAX_REASONABLE_PAGE || loadingMore ? "opacity-50" : ""}`}
          >
            {t("dashboard.next")}
          </button>
        </div>

        <div className="mt-6">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
