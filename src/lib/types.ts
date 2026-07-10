export type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  groupLabel: string;
  round: string;
  kickoff: string;
  homeResult: number | null;
  awayResult: number | null;
  scoredAt: string | null;
};

export type User = {
  id: string;
  username: string;
  totalPoints: number;
};

export type Prediction = {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  boosted: boolean;
  pointsAwarded: number | null;
  submittedAt: string;
};

export type BoostAllowance = {
  id: string;
  userId: string;
  round: string;
  used: boolean;
  usedAt: string | null;
  matchId: string | null;
};

export type LeaderboardRow = {
  id: string;
  username: string;
  points: number;
  delta: number;
};

export type DashboardData = {
  currentUser: User;
  matches: Match[];
  predictions: Prediction[];
  boostAllowance: BoostAllowance;
  leaderboard: LeaderboardRow[];
};

export type SavePredictionInput = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  boosted: boolean;
};
