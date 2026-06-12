export function getTopScoreIndex(scores: readonly number[]): number {
  let maxIdx = 0;

  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[maxIdx]) {
      maxIdx = i;
    }
  }

  return maxIdx;
}

export function toProbabilities(scores: readonly number[]): number[] {
  if (scores.length === 0) {
    return [];
  }

  const finiteScores = scores.map(score => Number.isFinite(score) ? score : 0);
  const maxScore = Math.max(...finiteScores);
  const exps = finiteScores.map(score => Math.exp(score - maxScore));
  const sum = exps.reduce((total, value) => total + value, 0);

  if (!Number.isFinite(sum) || sum <= 0) {
    return finiteScores.map(() => 0);
  }

  return exps.map(value => value / sum);
}
