import type { TensorflowModel } from 'react-native-fast-tflite';

import { runInference } from './audio-utils';

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn(),
}));

function createModel(shape: number[], output: Float32Array, runSync = jest.fn(() => [output])): TensorflowModel {
  return {
    delegate: 'default',
    inputs: [{ name: 'input', dataType: 'float32', shape }],
    outputs: [{ name: 'output', dataType: 'float32', shape: [output.length] }],
    run: jest.fn(async () => [output]),
    runSync,
  };
}

describe('runInference', () => {
  it('trims audio to the tensor input length', () => {
    const output = new Float32Array([0.1, 0.9]);
    const runSync = jest.fn(() => [output]);
    const model = createModel([1, 4], output, runSync);

    const result = runInference(model, new Float32Array([1, 2, 3, 4, 5, 6]));

    expect(runSync).toHaveBeenCalledWith([new Float32Array([1, 2, 3, 4])]);
    expect(result).toBe(output);
  });

  it('pads audio when the tensor expects more samples', () => {
    const output = new Float32Array([0.6, 0.4]);
    const runSync = jest.fn(() => [output]);
    const model = createModel([1, 5], output, runSync);

    runInference(model, new Float32Array([1, 2, 3]));

    expect(runSync).toHaveBeenCalledWith([new Float32Array([1, 2, 3, 0, 0])]);
  });

  it('keeps the original audio length for dynamic input tensors', () => {
    const output = new Float32Array([1]);
    const runSync = jest.fn(() => [output]);
    const model = createModel([1, -1], output, runSync);
    const input = new Float32Array([1, 2, 3]);

    runInference(model, input);

    expect(runSync).toHaveBeenCalledWith([input]);
  });
});
