import type { TensorflowModel } from 'react-native-fast-tflite';
import type { ModelClassificationResult } from './types';

import type { AudioDecodeOptions, AudioPreprocessInput, AudioPreprocessOptions } from '@/lib/ai/audio-utils';
import { loadTensorflowModel } from 'react-native-fast-tflite';

import { preprocessAudio, runInference } from '@/lib/ai/audio-utils';
import { getTopScoreIndex, toProbabilities } from './score-utils';

const LABELS = ['bad_ignition', 'dead_battery', 'normal_engine_startup'] as const;

const MODEL = require('../../../../assets/models/startup_state_classifier.tflite') as number;

let loadedModel: TensorflowModel | null = null;

export async function loadStartupModel(): Promise<TensorflowModel> {
  if (!loadedModel) {
    loadedModel = await loadTensorflowModel(MODEL);
  }
  return loadedModel;
}

export async function classifyStartup(
  audio: AudioPreprocessInput,
  options: AudioPreprocessOptions & AudioDecodeOptions = {},
): Promise<ModelClassificationResult> {
  const model = await loadStartupModel();
  const preprocessed = await preprocessAudio(audio, options);
  const output = runInference(model, preprocessed);

  const rawScores = Array.from(output);
  const probabilities = toProbabilities(rawScores);
  const maxIdx = getTopScoreIndex(probabilities);

  return {
    model: 'startup',
    label: LABELS[maxIdx] ?? 'unknown',
    probabilities,
    rawScores,
    score: probabilities[maxIdx] ?? 0,
    labels: LABELS,
  };
}
