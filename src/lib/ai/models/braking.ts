import type { TensorflowModel } from 'react-native-fast-tflite';
import { loadTensorflowModel } from 'react-native-fast-tflite';

import type { AudioDecodeOptions, AudioPreprocessInput, AudioPreprocessOptions } from '@/lib/ai/audio-utils';
import { preprocessAudio, runInference } from '@/lib/ai/audio-utils';

import type { ModelClassificationResult } from './types';

const LABELS = ['normal', 'worn_out'] as const;

const MODEL = require('../../../assets/models/yamnet_bracking_classifier.tflite') as number;

let loadedModel: TensorflowModel | null = null;

export async function loadBrakingModel(): Promise<TensorflowModel> {
  if (!loadedModel) {
    loadedModel = await loadTensorflowModel(MODEL, []);
  }
  return loadedModel;
}

export async function classifyBraking(
  audio: AudioPreprocessInput,
  options: AudioPreprocessOptions & AudioDecodeOptions = {},
): Promise<ModelClassificationResult> {
  const model = await loadBrakingModel();
  const preprocessed = await preprocessAudio(audio, options);
  const output = runInference(model, preprocessed);

  const rawScores = Array.from(output);
  let maxIdx = 0;
  for (let i = 1; i < rawScores.length; i++) {
    if (rawScores[i] > rawScores[maxIdx]) maxIdx = i;
  }

  return {
    model: 'braking',
    label: LABELS[maxIdx] ?? 'unknown',
    score: rawScores[maxIdx],
    rawScores,
    labels: LABELS,
  };
}
