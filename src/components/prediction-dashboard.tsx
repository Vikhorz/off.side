"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  savePredictionAction,
  type SavePredictionState,
} from "@/app/actions";
import type { DashboardData, Match, Prediction } from "@/lib/types";

type Draft = {
  homeScore: number;
  awayScore: number;
  boosted: boolean;
};

type PredictionDashboardProps = {
  data: DashboardData;
};

const initialState: SavePredictionState = {
  status: "idle",
  message:
    "Predictions are saved server-side. Scoring waits for final results and the cron job.",
};

export function PredictionDashboard({ data }: PredictionDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState(initialState);
  const [drafts, setDrafts] = useState(() => buildInitialDrafts(data));
  const savedBoostMatchId = data.boostAllowance.matchId;

  const boostLockedTo = useMemo(() => {
    const activeDraft = Object.entries(drafts).find(([, draft]) => draft.boosted);
    return activeDraft?.[0] ?? savedBoostMatchId;
  }, [drafts, savedBoostMatchId]);

  function updateDraft(matchId: string, update: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [matchId]: {
        ...current[matchId],
        ...update,
      },
    }));
  }

  function toggleBoost(matchId: string) {
    setDrafts((current) => {
      const isAlreadyBoosted = current[matchId]?.boosted;
      const next = Object.fromEntries(
        Object.entries(current).map(([id, draft]) => [
          id,
          { ...draft, boosted: false },
        ]),
      );
      next[matchId] = {
        ...next[matchId],
        boosted: !isAlreadyBoosted,
      };
      return next;
    });
  }

  function save(match: Match) {
    startTransition(async () => {
      const result = await savePredictionAction({
        matchId: match.id,
        ...drafts[match.id],
      });
      setState(result);
      router.refresh();
    });
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#predict" aria-label="Off.side home">
          <span className="brandIcon" aria-hidden="true" />
          <span>Off.side</span>
        </a>
        <nav aria-label="Sections">
          <a href="#predict">Predict</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href="#rules">Rules</a>
          <a href="#schema">Schema</a>
        </nav>
        <div className="userPill">
          <span className="onlineDot" aria-hidden="true" />
          {data.currentUser.username}
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="heroCopy">
          <p className="eyebrow">World Cup 2026 prediction league</p>
          <h1 id="hero-title">Off.side</h1>
          <p>
            Make score predictions before kickoff, spend one boost per round,
            and let server-side scoring settle the leaderboard.
          </p>
          <div className="chips" aria-label="Product qualities">
            <span>Server scored</span>
            <span>Boost validated</span>
            <span>Deadline locked</span>
          </div>
        </div>
        <div className="heroPanel" aria-label="Current league status">
          <div>
            <span className="panelLabel">Round</span>
            <strong>Round of 16</strong>
          </div>
          <div>
            <span className="panelLabel">Boost</span>
            <strong>{data.boostAllowance.used ? "Used" : "Available"}</strong>
          </div>
          <div>
            <span className="panelLabel">Pending picks</span>
            <strong>{data.predictions.length}</strong>
          </div>
        </div>
      </section>

      <section className="appGrid" id="predict">
        <aside className="panel leaderboard" id="leaderboard">
          <div className="sectionTitle">
            <p>Group leaderboard</p>
            <span>Live demo</span>
          </div>
          <ol>
            {data.leaderboard.map((row, index) => (
              <li key={row.id}>
                <span className="rank">{index + 1}</span>
                <span>
                  <strong>{row.username}</strong>
                  <small>
                    {row.delta > 0
                      ? `+${row.delta} pending pick`
                      : "No pending delta"}
                  </small>
                </span>
                <span className="points">{row.points}</span>
              </li>
            ))}
          </ol>
        </aside>

        <section className="panel matchPanel" aria-labelledby="matches-title">
          <div className="sectionTitle">
            <p id="matches-title">Predictions</p>
            <span>{isPending ? "Saving..." : "Server action ready"}</span>
          </div>
          <div className={`notice ${state.status}`}>{state.message}</div>
          <div className="matchList">
            {data.matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                draft={drafts[match.id]}
                savedPrediction={data.predictions.find(
                  (prediction) => prediction.matchId === match.id,
                )}
                boostLockedTo={boostLockedTo}
                isPending={isPending}
                onUpdate={updateDraft}
                onBoost={toggleBoost}
                onSave={save}
              />
            ))}
          </div>
        </section>
      </section>

      <RulesAndSchema />
    </main>
  );
}

function MatchCard({
  match,
  draft,
  savedPrediction,
  boostLockedTo,
  isPending,
  onUpdate,
  onBoost,
  onSave,
}: {
  match: Match;
  draft: Draft;
  savedPrediction?: Prediction;
  boostLockedTo?: string | null;
  isPending: boolean;
  onUpdate: (matchId: string, update: Partial<Draft>) => void;
  onBoost: (matchId: string) => void;
  onSave: (match: Match) => void;
}) {
  const locked = Date.now() >= new Date(match.kickoff).getTime();
  const boostUnavailable = Boolean(boostLockedTo && boostLockedTo !== match.id);

  return (
    <article className="matchCard">
      <div className="matchHeader">
        <div>
          <strong>
            {match.homeTeam} vs {match.awayTeam}
          </strong>
          <small>{match.groupLabel}</small>
        </div>
        <span className={locked ? "status locked" : "status open"}>
          {locked ? "Locked" : "Open"}
        </span>
      </div>

      <div className="scoreRows">
        <ScoreRow
          team={match.homeTeam}
          value={draft.homeScore}
          disabled={locked || isPending}
          onChange={(value) => onUpdate(match.id, { homeScore: value })}
        />
        <ScoreRow
          team={match.awayTeam}
          value={draft.awayScore}
          disabled={locked || isPending}
          onChange={(value) => onUpdate(match.id, { awayScore: value })}
        />
      </div>

      <div className="matchFooter">
        <small>
          Kickoff:{" "}
          {new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(match.kickoff))}
        </small>
        <div className="actions">
          <button
            type="button"
            className={draft.boosted ? "boost active" : "boost"}
            disabled={locked || isPending || boostUnavailable}
            onClick={() => onBoost(match.id)}
          >
            {draft.boosted ? "Boosted" : "Boost"}
          </button>
          <button
            type="button"
            className="save"
            disabled={locked || isPending}
            onClick={() => onSave(match)}
          >
            {savedPrediction ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ScoreRow({
  team,
  value,
  disabled,
  onChange,
}: {
  team: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="scoreRow">
      <span>{team}</span>
      <span className="scoreControl">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Decrease ${team} score`}
        >
          -
        </button>
        <input
          value={value}
          min={0}
          max={12}
          inputMode="numeric"
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={`${team} predicted score`}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(Math.min(12, value + 1))}
          aria-label={`Increase ${team} score`}
        >
          +
        </button>
      </span>
    </label>
  );
}

function RulesAndSchema() {
  return (
    <>
      <section className="panel rules" id="rules">
        <div className="sectionTitle">
          <p>Scoring rules</p>
          <span>Server-side only</span>
        </div>
        <div className="scoreTable">
          <div>Exact score</div>
          <strong>+5</strong>
          <strong>+10 boosted</strong>
          <div>Correct winner + goal difference</div>
          <strong>+3</strong>
          <strong>+6 boosted</strong>
          <div>Correct winner only</div>
          <strong>+1</strong>
          <strong>+2 boosted</strong>
          <div>Wrong result or no prediction</div>
          <strong>0</strong>
          <strong>0</strong>
        </div>
      </section>

      <section className="panel schema" id="schema">
        <div className="sectionTitle">
          <p>Production model</p>
          <span>Prisma + Supabase</span>
        </div>
        <div className="schemaGrid">
          <article>
            <strong>User</strong>
            <p>username, passwordHash, optional email, totalPoints</p>
          </article>
          <article>
            <strong>Match</strong>
            <p>teams, kickoff, result fields, scoredAt timestamp</p>
          </article>
          <article>
            <strong>Prediction</strong>
            <p>userId, matchId, score picks, boosted, pointsAwarded</p>
          </article>
          <article>
            <strong>BoostAllowance</strong>
            <p>userId, round, used, usedAt, server-owned match binding</p>
          </article>
        </div>
      </section>
    </>
  );
}

function buildInitialDrafts(data: DashboardData) {
  return Object.fromEntries(
    data.matches.map((match) => {
      const prediction = data.predictions.find(
        (item) => item.matchId === match.id,
      );
      return [
        match.id,
        {
          homeScore: prediction?.homeScore ?? 0,
          awayScore: prediction?.awayScore ?? 0,
          boosted:
            prediction?.boosted || data.boostAllowance.matchId === match.id,
        },
      ];
    }),
  ) as Record<string, Draft>;
}
