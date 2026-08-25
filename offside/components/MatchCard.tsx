"use client";
import { useState, useEffect } from "react";
import { Toast } from "./Toast";
import { useI18n } from "@/lib/i18n";
import { getClubLogo, getClubLogoAsync } from "@/lib/clubs";

type Prediction = { homeScore: number; awayScore: number; boosted: boolean; pointsAwarded: number | null } | null;

type Match = {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  round: string;
  kickoff: string;
  homeResult: number | null;
  awayResult: number | null;
  userPrediction: Prediction;
};

function ScoreStepper({ value, onChange, disabled, label }: {
  value: number | "";
  onChange: (v: number | "") => void;
  disabled: boolean;
  label: string;
}) {
  function handleTextChange(raw: string) {
    const digits = raw.replace(/[^0-9]/g, "");
    if (digits === "") { onChange(""); return; }
    onChange(Math.max(0, Math.min(20, Number(digits))));
  }
  function step(delta: number) {
    const current = value === "" ? 0 : value;
    onChange(Math.max(0, Math.min(20, current + delta)));
  }

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={disabled || value === 0 || value === ""}
        className="w-5 h-6 flex items-center justify-center text-steel disabled:opacity-30 hover:text-warm transition-colors"
        aria-label={`Decrease ${label} score`}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5" /></svg>
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="0"
        value={value}
        disabled={disabled}
        onChange={(e) => handleTextChange(e.target.value)}
        className="w-6 text-center text-base font-medium text-warm bg-transparent outline-none font-mono disabled:text-steel placeholder:text-steel/50"
        aria-label={`${label} predicted score`}
      />
      <button
        type="button"
        onClick={() => step(1)}
        disabled={disabled || value === 20}
        className="w-5 h-6 flex items-center justify-center text-steel disabled:opacity-30 hover:text-warm transition-colors"
        aria-label={`Increase ${label} score`}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>
  );
}

export function MatchCard({ match, boostAvailable, onSaved }: {
  match: Match;
  boostAvailable: boolean;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const locked = new Date() >= new Date(match.kickoff);
  const [home, setHome] = useState<number | "">(match.userPrediction?.homeScore ?? "");
  const [away, setAway] = useState<number | "">(match.userPrediction?.awayScore ?? "");
  const [boostedInput, setBoostedInput] = useState(match.userPrediction?.boosted ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [saved, setSaved] = useState(!!match.userPrediction);

  // Initialize with synchronous logo to avoid flicker
  const [homeLogo, setHomeLogo] = useState<string>(getClubLogo(match.homeTeam));
  const [awayLogo, setAwayLogo] = useState<string>(getClubLogo(match.awayTeam));
  const [logoLoading, setLogoLoading] = useState<boolean>(true);

  // Once saved, the boost status is fully owned by the server (it can change
  // here if another match's save reassigns this week's token) — so we mirror
  // it live instead of trusting a local copy taken at mount time. Before
  // saving, the toggle is purely local/editable.
  const boosted = saved ? (match.userPrediction?.boosted ?? false) : boostedInput;

  useEffect(() => {
    // Fetch logos for both teams
    const fetchLogos = async () => {
      setLogoLoading(true);
      try {
        const [homeLogoUrl, awayLogoUrl] = await Promise.all([
          getClubLogoAsync(match.homeTeam),
          getClubLogoAsync(match.awayTeam)
        ]);
        // Only set state if the URL is different to avoid unnecessary renders and flicker
        if (homeLogoUrl !== homeLogo) {
          setHomeLogo(homeLogoUrl);
        }
        if (awayLogoUrl !== awayLogo) {
          setAwayLogo(awayLogoUrl);
        }
      } catch (error) {
        console.error("Error fetching logos:", error);
        // Fallbacks will be handled by getClubLogo (already in state)
        // Ensure we have the fallback set (should already be there from initialization)
        setHomeLogo(getClubLogo(match.homeTeam));
        setAwayLogo(getClubLogo(match.awayTeam));
      } finally {
        setLogoLoading(false);
      }
    };

    fetchLogos();
  }, [match.homeTeam, match.awayTeam]);

  async function save() {
    if (home === "" || away === "") {
      setError(t("match.enterBoth"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, homeScore: home, awayScore: away, boosted: boostedInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save prediction");
      } else {
        setBoostedInput(data.boosted ?? false);
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

  // A match realistically lasts ~2-2.5 hours including stoppage/extra time.
  // Beyond ~3 hours post-kickoff with no result entered yet, showing "Live"
  // is actively misleading — switch to a neutral "awaiting result" state.
  const hoursSinceKickoff = (Date.now() - new Date(match.kickoff).getTime()) / 3600000;
  const isLive = locked && match.homeResult === null && hoursSinceKickoff < 3;
  const awaitingResult = locked && match.homeResult === null && hoursSinceKickoff >= 3;
  const kickoffLabel = new Date(match.kickoff).toLocaleString("en-GB", {
    timeZone: "Asia/Baghdad",
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }) + ` (${t("match.baghdad")})`;

  const inputsDisabled = locked || saved;

  return (
    <div className={`bg-card border border-border rounded-xl p-3.5 mb-2 ${locked && !isLive ? "opacity-60" : ""}`}>
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[10px] text-steel">
          <span className="text-indigo-mid font-medium">{match.competition}</span> · {match.round} · {kickoffLabel}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1 text-[10px] text-coral-mid font-medium">
            <span className="w-1.5 h-1.5 bg-coral rounded-full live-dot" /> {t("match.live")}
          </span>
        ) : awaitingResult ? (
          <span className="text-[10px] text-steel">{t("match.awaitingResult")}</span>
        ) : locked ? (
          <span className="text-[10px] text-steel">{t("match.final")}</span>
        ) : saved ? (
          <span className="flex items-center gap-1 text-[10px] text-indigo-mid font-medium">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            {t("match.saved")}
          </span>
        ) : (
          <span className="text-[10px] text-steel">{t("match.opens")}</span>
        )}
      </div>

      <div className={`flex items-center gap-4 ${inputsDisabled ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex-shrink-0">
            <img
              src={homeLogo}
              alt={`${match.homeTeam} logo`}
              className="absolute inset-0 w-full h-full object-contain"
              onError={(e) => {
                const imgElement = e.target as HTMLImageElement;
                imgElement.src = getClubLogo(match.homeTeam);
              }}
            />
          </div>
          <span className="font-grotesk text-sm font-medium text-warm truncate max-w-[100px] block">{match.homeTeam}</span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-3 bg-navy border border-border rounded-md px-3 py-1.5">
          <ScoreStepper value={home} onChange={setHome} disabled={inputsDisabled} label={match.homeTeam} />
          <span className="text-steel text-sm">–</span>
          <ScoreStepper value={away} onChange={setAway} disabled={inputsDisabled} label={match.awayTeam} />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-grotesk text-sm font-medium text-warm truncate max-w-[100px] block text-end">{match.awayTeam}</span>
          <div className="relative w-8 h-8 flex-shrink-0">
            <img
              src={awayLogo}
              alt={`${match.awayTeam} logo`}
              className="absolute inset-0 w-full h-full object-contain"
              onError={(e) => {
                const imgElement = e.target as HTMLImageElement;
                imgElement.src = getClubLogo(match.awayTeam);
              }}
            />
          </div>
        </div>
      </div>

      {match.homeResult !== null && (
        <div className="text-[11px] text-steel mt-2 text-center">
          {t("match.finalResult")}: {match.homeResult}–{match.awayResult}
          {match.userPrediction?.pointsAwarded !== null && match.userPrediction?.pointsAwarded !== undefined && (
            <span className="text-indigo-mid font-medium"> · +{match.userPrediction.pointsAwarded} pts</span>
          )}
        </div>
      )}

      {!locked && (
        <div className="flex flex-wrap justify-between items-center gap-y-2 mt-2.5">
          <label className={`flex items-center gap-2 text-[10px] sm:text-[11px] text-steel ${saved ? "opacity-50" : "cursor-pointer"}`}>
            <button
              type="button"
              onClick={() => !saved && setBoostedInput((b) => !b)}
              disabled={saved || (!boostAvailable && !boosted)}
              className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 ${
                boosted ? "bg-indigo justify-end" : "bg-border justify-start"
              } ${saved || (!boostAvailable && !boosted) ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <span className="w-3 h-3 bg-white rounded-full block" />
            </button>
            {boosted ? t("match.boostActive") : boostAvailable ? t("match.useBoost") : t("match.boostUsedElsewhere")}
          </label>

          {saved ? (
            <button
              onClick={() => {
                setBoostedInput(match.userPrediction?.boosted ?? false);
                setSaved(false);
              }}
              className="text-[11px] font-medium px-3 py-1.5 rounded-md border border-border text-steel hover:text-warm hover:border-indigo transition-colors"
            >
              {t("match.edit")}
            </button>
          ) : (
            <button
              onClick={save}
              disabled={saving}
              className="text-[11px] font-medium px-3 py-1.5 rounded-md bg-indigo text-white hover:bg-indigo/90 disabled:opacity-50 transition-colors"
            >
              {saving ? t("match.saving") : t("match.save")}
            </button>
          )}
        </div>
      )}
      {error && <p className="text-[11px] text-coral-mid mt-1.5">{error}</p>}
      <Toast message={t("match.saved.toast")} show={showToast} />
    </div>
  );
}