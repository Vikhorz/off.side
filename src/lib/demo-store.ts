import "server-only";

import { calculatePredictionPoints, clampPredictedScore } from "@/lib/scoring";
import type {
  BoostAllowance,
  DashboardData,
  LeaderboardRow,
  Match,
  Prediction,
  SavePredictionInput,
  User,
} from "@/lib/types";

type Store = {
  users: User[];
  matches: Match[];
  predictions: Prediction[];
  boosts: BoostAllowance[];
};

const now = new Date();
const kickoffAt = (hoursFromNow: number) =>
  new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000).toISOString();

const initialStore: Store = {
  users: [
    { id: "user-sara", username: "Sara", totalPoints: 42 },
    { id: "user-omar", username: "Omar", totalPoints: 39 },
    { id: "user-rami", username: "Rami", totalPoints: 36 },
    { id: "user-mina", username: "Mina", totalPoints: 34 },
    { id: "user-ali", username: "Ali", totalPoints: 31 },
  ],
  matches: [
    {
      id: "match-ned-jpn",
      homeTeam: "Netherlands",
      awayTeam: "Japan",
      groupLabel: "A1 vs B2",
      round: "round-of-16",
      kickoff: kickoffAt(5),
      homeResult: null,
      awayResult: null,
      scoredAt: null,
    },
    {
      id: "match-arg-mar",
      homeTeam: "Argentina",
      awayTeam: "Morocco",
      groupLabel: "C1 vs D2",
      round: "round-of-16",
      kickoff: kickoffAt(27),
      homeResult: null,
      awayResult: null,
      scoredAt: null,
    },
    {
      id: "match-esp-bra",
      homeTeam: "Spain",
      awayTeam: "Brazil",
      groupLabel: "E1 vs F1",
      round: "round-of-16",
      kickoff: kickoffAt(51),
      homeResult: null,
      awayResult: null,
      scoredAt: null,
    },
    {
      id: "match-fra-usa",
      homeTeam: "France",
      awayTeam: "USA",
      groupLabel: "G1 vs H2",
      round: "round-of-16",
      kickoff: kickoffAt(-2),
      homeResult: null,
      awayResult: null,
      scoredAt: null,
    },
  ],
  predictions: [],
  boosts: [
    {
      id: "boost-rami-r16",
      userId: "user-rami",
      round: "round-of-16",
      used: false,
      usedAt: null,
      matchId: null,
    },
  ],
};

const globalForStore = globalThis as typeof globalThis & {
  offsideDemoStore?: Store;
};

function store() {
  if (!globalForStore.offsideDemoStore) {
    globalForStore.offsideDemoStore = structuredClone(initialStore);
  }

  return globalForStore.offsideDemoStore;
}

function assertDeadlineOpen(match: Match) {
  if (Date.now() >= new Date(match.kickoff).getTime()) {
    throw new Error("Prediction deadline passed for this match.");
  }
}

function getRoundBoost(userId: string, round: string) {
  const data = store();
  let boost = data.boosts.find(
    (item) => item.userId === userId && item.round === round,
  );

  if (!boost) {
    boost = {
      id: `boost-${userId}-${round}`,
      userId,
      round,
      used: false,
      usedAt: null,
      matchId: null,
    };
    data.boosts.push(boost);
  }

  return boost;
}

export async function getDashboardData(currentUser: User): Promise<DashboardData> {
  const data = store();
  const currentUserPredictions = data.predictions.filter(
    (prediction) => prediction.userId === currentUser.id,
  );
  const boostAllowance = getRoundBoost(currentUser.id, "round-of-16");

  return {
    currentUser,
    matches: data.matches,
    predictions: currentUserPredictions,
    boostAllowance,
    leaderboard: getLeaderboardRows(currentUser.id),
  };
}

export async function savePredictionForUser(
  currentUser: User,
  input: SavePredictionInput,
) {
  const data = store();
  const match = data.matches.find((item) => item.id === input.matchId);

  if (!match) {
    throw new Error("Match not found.");
  }

  assertDeadlineOpen(match);

  const boost = getRoundBoost(currentUser.id, match.round);
  const shouldBoost = input.boosted && !boost.used;
  const existingPrediction = data.predictions.find(
    (prediction) =>
      prediction.userId === currentUser.id && prediction.matchId === match.id,
  );

  if (input.boosted && boost.used && boost.matchId !== match.id) {
    throw new Error("Boost allowance already used for this round.");
  }

  const savedPrediction: Prediction = {
    id: existingPrediction?.id ?? `pred-${currentUser.id}-${match.id}`,
    userId: currentUser.id,
    matchId: match.id,
    homeScore: clampPredictedScore(input.homeScore),
    awayScore: clampPredictedScore(input.awayScore),
    boosted: shouldBoost || boost.matchId === match.id,
    pointsAwarded: null,
    submittedAt: new Date().toISOString(),
  };

  if (existingPrediction) {
    Object.assign(existingPrediction, savedPrediction);
  } else {
    data.predictions.push(savedPrediction);
  }

  if (savedPrediction.boosted) {
    boost.used = true;
    boost.usedAt = new Date().toISOString();
    boost.matchId = match.id;
  }

  return savedPrediction;
}

export async function scoreCompletedMatches() {
  const data = store();
  let scoredPredictions = 0;

  for (const match of data.matches) {
    if (
      match.homeResult === null ||
      match.awayResult === null ||
      match.scoredAt === null
    ) {
      continue;
    }

    const matchPredictions = data.predictions.filter(
      (prediction) =>
        prediction.matchId === match.id && prediction.pointsAwarded === null,
    );

    for (const prediction of matchPredictions) {
      const result = calculatePredictionPoints(
        { home: prediction.homeScore, away: prediction.awayScore },
        { home: match.homeResult, away: match.awayResult },
        prediction.boosted,
      );
      prediction.pointsAwarded = result.points;
      const user = data.users.find((item) => item.id === prediction.userId);
      if (user) user.totalPoints += result.points;
      scoredPredictions += 1;
    }
  }

  return { scoredPredictions };
}

function getLeaderboardRows(currentUserId: string): LeaderboardRow[] {
  const data = store();

  return data.users
    .map((user) => {
      const pendingPredictions = data.predictions.filter(
        (prediction) =>
          prediction.userId === user.id && prediction.pointsAwarded === null,
      ).length;
      return {
        id: user.id,
        username: user.username,
        points: user.totalPoints + (user.id === currentUserId ? pendingPredictions : 0),
        delta: user.id === currentUserId ? pendingPredictions : 0,
      };
    })
    .sort((left, right) => right.points - left.points);
}
