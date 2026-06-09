import type { TensorflowModel } from 'react-native-fast-tflite';
import { loadTensorflowModel } from 'react-native-fast-tflite';

import type { AudioDecodeOptions, AudioPreprocessInput, AudioPreprocessOptions } from '@/lib/ai/audio-utils';
import { preprocessAudio, runInference } from '@/lib/ai/audio-utils';

import type { ModelClassificationResult } from './types';

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
  let maxIdx = 0;
  for (let i = 1; i < rawScores.length; i++) {
    if (rawScores[i] > rawScores[maxIdx]) maxIdx = i;
  }

  return {
    model: 'startup',
    label: LABELS[maxIdx] ?? 'unknown',
    score: rawScores[maxIdx],
    rawScores,
    labels: LABELS,
  };
}
