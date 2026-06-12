import type { TensorflowModel } from 'react-native-fast-tflite';
import type { ModelClassificationResult } from './types';

import type { AudioDecodeOptions, AudioPreprocessInput, AudioPreprocessOptions } from '@/lib/ai/audio-utils';
import { loadTensorflowModel } from 'react-native-fast-tflite';

import { preprocessAudio, runInference } from '@/lib/ai/audio-utils';
import { getTopScoreIndex, toProbabilities } from './score-utils';

const LABELS = ['low_oil', 'normal_engine_idle', 'power_steering', 'serpentine_belt'] as const;

const MODEL = require('../../../../assets/models/idle_state_classifier.tflite') as number;

let loadedModel: TensorflowModel | null = null;

export async function loadIdleModel(): Promise<TensorflowModel> {
  if (!loadedModel) {
    loadedModel = await loadTensorflowModel(MODEL);
  }
  return loadedModel;
}

export async function classifyIdle(
  audio: AudioPreprocessInput,
  options: AudioPreprocessOptions & AudioDecodeOptions = {},
): Promise<ModelClassificationResult> {
  const model = await loadIdleModel();
  const preprocessed = await preprocessAudio(audio, options);
  const output = runInference(model, preprocessed);

  const rawScores = Array.from(output);
  const probabilities = toProbabilities(rawScores);
  const maxIdx = getTopScoreIndex(probabilities);

  return {
    model: 'idle',
    label: LABELS[maxIdx] ?? 'unknown',
    probabilities,
    rawScores,
    score: probabilities[maxIdx] ?? 0,
    labels: LABELS,
  };
}
