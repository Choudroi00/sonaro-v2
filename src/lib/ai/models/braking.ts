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
  if (!loadedModel) {
    loadedModel = await loadTensorflowModel(MODEL);
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
  const probabilities = toProbabilities(rawScores);
  const maxIdx = getTopScoreIndex(probabilities);
  const label = LABELS[maxIdx] ?? 'unknown';

  if (__DEV__) {
    console.log('Braking inference', {
      inputShape: model.inputs[0]?.shape ?? [],
      label,
      preprocessedLength: preprocessed.length,
      probabilities,
      rawScores,
    });
  }

  return {
    model: 'braking',
    label,
    probabilities,
    rawScores,
    score: probabilities[maxIdx] ?? 0,
    labels: LABELS,
  };
}
