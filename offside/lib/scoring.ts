export function calculatePoints(
  predicted: { homeScore: number; awayScore: number },
  result: { homeResult: number; awayResult: number },
  boosted: boolean
): number {
  const exactMatch = predicted.homeScore === result.homeResult && predicted.awayScore === result.awayResult;
  const pw = predicted.homeScore > predicted.awayScore ? "home" : predicted.homeScore < predicted.awayScore ? "away" : "draw";
  const aw = result.homeResult > result.awayResult ? "home" : result.homeResult < result.awayResult ? "away" : "draw";
  const correctWinner = pw === aw;
  const correctDiff = (predicted.homeScore - predicted.awayScore) === (result.homeResult - result.awayResult);
  let pts = exactMatch ? 5 : correctWinner && correctDiff ? 3 : correctWinner ? 1 : 0;
  return boosted ? pts * 2 : pts;
}
