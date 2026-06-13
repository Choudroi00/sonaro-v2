import type { TensorflowModel } from 'react-native-fast-tflite';

import { runInference } from './audio-utils';

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn(),
}));

function toBuffer(values: Float32Array): ArrayBuffer {
  const bytes = new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
  return bytes.slice().buffer;
}

function createModel(shape: number[], output: Float32Array, runSync?: jest.Mock<ArrayBuffer[], [ArrayBuffer[]]>): TensorflowModel {
  const runSyncImpl = runSync ?? jest.fn<ArrayBuffer[], [ArrayBuffer[]]>(() => [toBuffer(output)]);

  return {
    dispose: jest.fn(),
    equals: jest.fn(),
    name: 'mock-model',
    delegates: [],
    inputs: [{ name: 'input', dataType: 'float32', shape }],
    outputs: [{ name: 'output', dataType: 'float32', shape: [output.length] }],
    run: jest.fn(async () => [toBuffer(output)]),
    runSync: runSyncImpl,
  } as unknown as TensorflowModel;
}

describe('runInference', () => {
  it('trims audio to the tensor input length', () => {
    const output = new Float32Array([0.1, 0.9]);
    const runSync = jest.fn<ArrayBuffer[], [ArrayBuffer[]]>(() => [toBuffer(output)]);
    const model = createModel([1, 4], output, runSync);

    const result = runInference(model, new Float32Array([1, 2, 3, 4, 5, 6]));

    expect(runSync).toHaveBeenCalledWith([toBuffer(new Float32Array([1, 2, 3, 4]))]);
    expect(Array.from(result)).toEqual(Array.from(output));
  });

  it('pads audio when the tensor expects more samples', () => {
    const output = new Float32Array([0.6, 0.4]);
    const runSync = jest.fn<ArrayBuffer[], [ArrayBuffer[]]>(() => [toBuffer(output)]);
    const model = createModel([1, 5], output, runSync);

    runInference(model, new Float32Array([1, 2, 3]));

    expect(runSync).toHaveBeenCalledWith([toBuffer(new Float32Array([1, 2, 3, 0, 0]))]);
  });

  it('keeps the original audio length for dynamic input tensors', () => {
    const output = new Float32Array([1]);
    const runSync = jest.fn<ArrayBuffer[], [ArrayBuffer[]]>(() => [toBuffer(output)]);
    const model = createModel([1, -1], output, runSync);
    const input = new Float32Array([1, 2, 3]);

    runInference(model, input);

    expect(runSync).toHaveBeenCalledWith([toBuffer(input)]);
  });

  it('keeps the original audio length when the tensor shape is reported as batch-only [1]', () => {
    const output = new Float32Array([1]);
    const runSync = jest.fn<ArrayBuffer[], [ArrayBuffer[]]>(() => [toBuffer(output)]);
    const model = createModel([1], output, runSync);
    const input = new Float32Array([1, 2, 3]);

    runInference(model, input);

    expect(runSync).toHaveBeenCalledWith([toBuffer(input)]);
  });
});
