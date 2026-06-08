export type ModelClassificationResult = {
  label: string;
  model: string;
  rawScores: number[];
  score: number;
  labels: readonly string[];
};
