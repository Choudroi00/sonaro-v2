export type ModelClassificationResult = {
  label: string;
  model: string;
  probabilities: number[];
  rawScores: number[];
  score: number;
  labels: readonly string[];
};
