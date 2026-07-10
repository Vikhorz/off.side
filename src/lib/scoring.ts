type ScoreLine = {
  home: number;
  away: number;
};

export type PredictionScoreResult = {
  points: number;
  reason:
    | "exact-score"
    | "correct-winner-goal-difference"
    | "correct-winner"
    | "wrong-result";
};

function outcome(score: ScoreLine) {
  if (score.home > score.away) return "home";
  if (score.away > score.home) return "away";
  return "draw";
}

function goalDifference(score: ScoreLine) {
  return score.home - score.away;
}

export function calculatePredictionPoints(
  prediction: ScoreLine,
  result: ScoreLine,
  boosted: boolean,
): PredictionScoreResult {
  const multiplier = boosted ? 2 : 1;

  if (prediction.home === result.home && prediction.away === result.away) {
    return { points: 5 * multiplier, reason: "exact-score" };
  }

  if (
    outcome(prediction) === outcome(result) &&
    goalDifference(prediction) === goalDifference(result)
  ) {
    return {
      points: 3 * multiplier,
      reason: "correct-winner-goal-difference",
    };
  }

  if (outcome(prediction) === outcome(result)) {
    return { points: 1 * multiplier, reason: "correct-winner" };
  }

  return { points: 0, reason: "wrong-result" };
}

export function clampPredictedScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(12, Math.trunc(value)));
}
