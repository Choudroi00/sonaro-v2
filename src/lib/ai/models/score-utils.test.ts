import { getTopScoreIndex, toProbabilities } from './score-utils';

describe('score utils', () => {
  it('normalizes logits into probabilities', () => {
    const probabilities = toProbabilities([2, 1, 0]);

    expect(probabilities).toHaveLength(3);
    expect(probabilities[0]).toBeGreaterThan(probabilities[1] ?? 0);
    expect(probabilities[1]).toBeGreaterThan(probabilities[2] ?? 0);
    expect(probabilities.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 6);
  });

  it('returns the top score index', () => {
    expect(getTopScoreIndex([0.2, 0.7, 0.1])).toBe(1);
  });
});
