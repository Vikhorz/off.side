"use client";
import { useState } from "react";
import { Toast } from "./Toast";

type Prediction = { homeScore: number; awayScore: number; boosted: boolean; pointsAwarded: number | null } | null;

type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  group: string;
  kickoff: string;
  homeResult: number | null;
  awayResult: number | null;
  userPrediction: Prediction;
};

export function MatchCard({ match, boostAvailable, onSaved }: {
  match: Match;
  boostAvailable: boolean;
  onSaved: () => void;
}) {
  const locked = new Date() >= new Date(match.kickoff);
  const [home, setHome] = useState(match.userPrediction?.homeScore ?? 0);
  const [away, setAway] = useState(match.userPrediction?.awayScore ?? 0);
  const [boosted, setBoosted] = useState(match.userPrediction?.boosted ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  // "Saved" means the score inputs are locked/greyed until Edit is pressed —
  // starts true if a prediction already exists for this match.
  const [saved, setSaved] = useState(!!match.userPrediction);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, homeScore: home, awayScore: away, boosted }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save prediction");
      } else {
        // Sync boosted state to what the server actually validated —
        // it may differ from what was requested (e.g. boost moved elsewhere,
        // or unavailable because it's locked into another match).
        setBoosted(data.boosted ?? false);
        setSaved(true);
        onSaved();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setSaving(false);
    }
  }

  const isLive = locked && match.homeResult === null;
  const kickoffLabel = new Date(match.kickoff).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const inputsDisabled = locked || saved;

  return (
    <div className={`bg-card border border-border rounded-xl p-3.5 mb-2 ${locked && !isLive ? "opacity-60" : ""}`}>
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[10px] text-steel">{match.group} · {kickoffLabel}</span>
        {isLive ? (
          <span className="flex items-center gap-1 text-[10px] text-coral-mid font-medium">
            <span className="w-1.5 h-1.5 bg-coral rounded-full live-dot" /> Live
          </span>
        ) : locked ? (
          <span className="text-[10px] text-steel">Final</span>
        ) : saved ? (
          <span className="flex items-center gap-1 text-[10px] text-indigo-mid font-medium">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            Saved
          </span>
        ) : (
          <span className="text-[10px] text-steel">Opens for predictions</span>
        )}
      </div>

      <div className={`flex items-center gap-2 ${inputsDisabled ? "opacity-60" : ""}`}>
        <span className="font-grotesk text-sm font-medium text-warm flex-1 min-w-0 truncate">{match.homeTeam}</span>
        <div className="flex items-center gap-1 bg-navy border border-border rounded-md px-2.5 py-1 flex-shrink-0">
          <input
            type="number" min={0} max={20}
            value={home}
            disabled={inputsDisabled}
            onChange={(e) => setHome(Math.max(0, Math.min(20, Number(e.target.value))))}
            className="w-6 text-center text-base font-medium text-warm bg-transparent outline-none font-mono disabled:text-steel"
            aria-label={`${match.homeTeam} predicted score`}
          />
          <span className="text-steel text-sm">–</span>
          <input
            type="number" min={0} max={20}
            value={away}
            disabled={inputsDisabled}
            onChange={(e) => setAway(Math.max(0, Math.min(20, Number(e.target.value))))}
            className="w-6 text-center text-base font-medium text-warm bg-transparent outline-none font-mono disabled:text-steel"
            aria-label={`${match.awayTeam} predicted score`}
          />
        </div>
        <span className="font-grotesk text-sm font-medium text-warm flex-1 min-w-0 truncate text-right">{match.awayTeam}</span>
      </div>

      {match.homeResult !== null && (
        <div className="text-[11px] text-steel mt-2 text-center">
          Final result: {match.homeResult}–{match.awayResult}
          {match.userPrediction?.pointsAwarded !== null && match.userPrediction?.pointsAwarded !== undefined && (
            <span className="text-indigo-mid font-medium"> · +{match.userPrediction.pointsAwarded} pts</span>
          )}
        </div>
      )}

      {!locked && (
        <div className="flex flex-wrap justify-between items-center gap-y-2 mt-2.5">
          <label className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] text-steel ${saved ? "opacity-50" : "cursor-pointer"}`}>
            <button
              type="button"
              onClick={() => !saved && setBoosted((b) => !b)}
              disabled={saved || (!boostAvailable && !boosted)}
              className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 ${
                boosted ? "bg-indigo justify-end" : "bg-border justify-start"
              } ${saved || (!boostAvailable && !boosted) ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <span className="w-3 h-3 bg-white rounded-full block" />
            </button>
            {boosted ? "Boost active (2× points)" : boostAvailable ? "Use boost (2× points)" : "Boost used on another match"}
          </label>

          {saved ? (
            <button
              onClick={() => setSaved(false)}
              className="text-[11px] font-medium px-3 py-1.5 rounded-md border border-border text-steel hover:text-warm hover:border-indigo transition-colors"
            >
              Edit
            </button>
          ) : (
            <button
              onClick={save}
              disabled={saving}
              className="text-[11px] font-medium px-3 py-1.5 rounded-md bg-indigo text-white hover:bg-indigo/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save prediction"}
            </button>
          )}
        </div>
      )}
      {error && <p className="text-[11px] text-coral-mid mt-1.5">{error}</p>}
      <Toast message="Prediction saved" show={showToast} />
    </div>
  );
}
