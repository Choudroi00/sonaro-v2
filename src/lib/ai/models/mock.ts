import type { ModelClassificationResult } from './types';

const MODEL_LABELS = {
  braking: ['normal', 'worn_out'],
  idle: ['low_oil', 'normal_engine_idle', 'power_steering', 'serpentine_belt'],
  startup: ['bad_ignition', 'dead_battery', 'normal_engine_startup'],
} as const;

const LABEL_ALIASES: Record<string, readonly string[]> = {
  bad_ignition: ['bad ignition', 'bad_ignition', 'ignition'],
  dead_battery: ['dead battery', 'dead_battery', 'battery'],
  low_oil: ['low oil', 'low_oil', 'oil'],
  normal: ['normal'],
  normal_engine_idle: ['normal engine idle', 'normal_engine_idle', 'idle normal'],
  normal_engine_startup: ['normal engine startup', 'normal_engine_startup', 'startup normal'],
  power_steering: ['power steering', 'power_steering', 'steering'],
  serpentine_belt: ['serpentine belt', 'serpentine_belt', 'belt'],
  worn_out: ['worn out', 'worn_out', 'wornout'],
};

type SupportedModel = keyof typeof MODEL_LABELS;

export function createMockClassificationResult(
  model: SupportedModel,
  fileName: string,
): ModelClassificationResult {
  const labels = [...MODEL_LABELS[model]] as string[];
  const normalizedFileName = normalizeText(fileName);
  const matchedLabel = labels.find(label => matchesLabel(normalizedFileName, label));
  const topLabel = matchedLabel ?? labels[randomIndex(labels.length, -1)];
  const topScore = randomBetween(0.81, 0.97);
  const probabilities = buildProbabilityDistribution(labels, topLabel, topScore);
  const topIndex = labels.indexOf(topLabel);

  return {
    label: topLabel,
    labels,
    model,
    probabilities,
    rawScores: probabilities,
    score: probabilities[topIndex] ?? 0,
  };
}

function buildProbabilityDistribution(
  labels: readonly string[],
  topLabel: string,
  topScore: number,
): number[] {
  if (labels.length === 1) {
    return [1];
  }

  const topIndex = labels.indexOf(topLabel);
  const remainingTotal = 1 - topScore;
  const weights = labels.map((_, index) => index === topIndex ? 0 : Math.random() + 0.05);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);

  return labels.map((_, index) => {
    if (index === topIndex) {
      return roundScore(topScore);
    }

    return roundScore((remainingTotal * weights[index]) / weightSum);
  });
}

function matchesLabel(normalizedFileName: string, label: string): boolean {
  const aliases = LABEL_ALIASES[label] ?? [label];
  return aliases.some(alias => normalizedFileName.includes(normalizeText(alias)));
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function randomBetween(min: number, max: number): number {
  return min + (Math.random() * (max - min));
}

function randomIndex(length: number, excludedIndex: number): number {
  if (length <= 1) {
    return 0;
  }

  let index = Math.floor(Math.random() * length);

  if (index === excludedIndex) {
    index = (index + 1) % length;
  }

  return index;
}

function roundScore(value: number): number {
  return Math.round(value * 10000) / 10000;
}
