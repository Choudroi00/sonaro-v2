import type { TensorflowModel } from 'react-native-fast-tflite';
import type { ModelClassificationResult } from './types';

import type { AudioDecodeOptions, AudioPreprocessInput, AudioPreprocessOptions } from '@/lib/ai/audio-utils';
import { loadTensorflowModel } from 'react-native-fast-tflite';

import { preprocessAudio, runInference } from '@/lib/ai/audio-utils';
import { getTopScoreIndex, toProbabilities } from './score-utils';

const LABELS = ['normal', 'worn_out'] as const;

const MODEL = require('../../../../assets/models/yamnet_bracking_classifier.tflite') as number;

let loadedModel: TensorflowModel | null = null;

export async function loadBrakingModel(): Promise<TensorflowModel> {
  console.log('[braking] loadBrakingModel:start', {
    hasCachedModel: loadedModel !== null,
  });

  if (!loadedModel) {
    loadedModel = await loadTensorflowModel(MODEL, []);
    console.log('[braking] loadBrakingModel:loaded', {
      inputShape: loadedModel.inputs[0]?.shape ?? [],
      outputShape: loadedModel.outputs[0]?.shape ?? [],
    });
  }

  console.log('[braking] loadBrakingModel:return', {
    hasCachedModel: loadedModel !== null,
  });

  return loadedModel;
}

export async function classifyBraking(
  audio: AudioPreprocessInput,
  options: AudioPreprocessOptions & AudioDecodeOptions = {},
): Promise<ModelClassificationResult> {
  console.log('[braking] classifyBraking:start', {
    audio,
    options,
  });

  const model = await loadBrakingModel();
  console.log('[braking] classifyBraking:model-ready', {
    inputShape: model.inputs[0]?.shape ?? [],
    outputShape: model.outputs[0]?.shape ?? [],
  });

  const preprocessed = await preprocessAudio(audio, {
    ...options,
    normalize: false,
  });
  console.log('[braking] classifyBraking:preprocessed', {
    max: Math.max(...preprocessed),
    mean: preprocessed.reduce((sum, value) => sum + value, 0) / Math.max(1, preprocessed.length),
    min: Math.min(...preprocessed),
    preprocessedLength: preprocessed.length,
    preview: Array.from(preprocessed.slice(0, 8)),
    rms: Math.sqrt(preprocessed.reduce((sum, value) => sum + value * value, 0) / Math.max(1, preprocessed.length)),
  });

  const output = runInference(model, preprocessed);
  console.log('[braking] classifyBraking:inference-output', {
    outputLength: output.length,
    preview: Array.from(output.slice(0, 8)),
  });

  const rawScores = Array.from(output);
  const probabilities = resolveProbabilities(rawScores);
  const maxIdx = getTopScoreIndex(probabilities);
  const label = LABELS[maxIdx] ?? 'unknown';

  console.log('[braking] classifyBraking:result', {
    inputShape: model.inputs[0]?.shape ?? [],
    label,
    maxIdx,
    preprocessedLength: preprocessed.length,
    probabilities,
    rawScores,
  });

  return {
    model: 'braking',
    label,
    probabilities,
    rawScores,
    score: probabilities[maxIdx] ?? 0,
    labels: LABELS,
  };
}

function resolveProbabilities(scores: number[]): number[] {
  if (looksLikeProbabilities(scores)) {
    return scores;
  }

  return toProbabilities(scores);
}

function looksLikeProbabilities(scores: number[]): boolean {
  if (scores.length === 0) {
    return false;
  }

  let sum = 0;

  for (const score of scores) {
    if (!Number.isFinite(score) || score < 0 || score > 1) {
      return false;
    }

    sum += score;
  }

  return Math.abs(sum - 1) <= 1e-3;
}
