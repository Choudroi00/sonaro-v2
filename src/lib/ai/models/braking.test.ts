import type { TensorflowModel } from 'react-native-fast-tflite';

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn(),
}));

jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: jest.fn(),
}));

jest.mock('../../../../assets/models/yamnet_bracking_classifier.tflite', () => 1, { virtual: true });

jest.mock('@/lib/ai/audio-utils', () => {
  const actual = jest.requireActual('@/lib/ai/audio-utils');

  return {
    ...actual,
    preprocessAudio: jest.fn(async (input: { samples: Float32Array }) => input.samples),
  };
});

function createInputSensitiveModel(): TensorflowModel {
  const runSync = jest.fn(([input]: ArrayBuffer[]) => {
    const waveform = new Float32Array(input);
    const average = waveform.reduce((sum, value) => sum + value, 0) / Math.max(1, waveform.length);

    return average >= 0.5
      ? [new Float32Array([4, 1]).buffer]
      : [new Float32Array([1, 4]).buffer];
  });

  return {
    dispose: jest.fn(),
    equals: jest.fn(),
    name: 'mock-braking-model',
    delegates: [],
    inputs: [{ name: 'input', dataType: 'float32', shape: [1, 4] }],
    outputs: [{ name: 'output', dataType: 'float32', shape: [1, 2] }],
    run: jest.fn(async (input: ArrayBuffer[]) => runSync(input)),
    runSync,
  } as unknown as TensorflowModel;
}

describe('classifyBraking', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('changes the braking probabilities when the input waveform changes', async () => {
    const model = createInputSensitiveModel();
    const { loadTensorflowModel } = jest.requireMock('react-native-fast-tflite') as {
      loadTensorflowModel: jest.Mock;
    };

    loadTensorflowModel.mockResolvedValue(model);

    const { classifyBraking } = require('./braking');
    const quietInput = { samples: new Float32Array([0, 0, 0, 0]), sampleRate: 16_000, channelCount: 1 };
    const loudInput = { samples: new Float32Array([1, 1, 1, 1]), sampleRate: 16_000, channelCount: 1 };

    const quietResult = await classifyBraking(quietInput);
    const loudResult = await classifyBraking(loudInput);

    expect(quietResult.label).toBe('worn_out');
    expect(loudResult.label).toBe('normal');
    expect(quietResult.probabilities).not.toEqual(loudResult.probabilities);
    expect(model.runSync).toHaveBeenNthCalledWith(1, [quietInput.samples.buffer.slice(0)]);
    expect(model.runSync).toHaveBeenNthCalledWith(2, [loudInput.samples.buffer.slice(0)]);
  });

  it('preserves model probabilities when the output already sums to one', async () => {
    const runSync = jest.fn(() => [new Float32Array([0.1, 0.9]).buffer]);
    const model: TensorflowModel = {
      dispose: jest.fn(),
      equals: jest.fn(),
      name: 'mock-braking-prob-model',
      delegates: [],
      inputs: [{ name: 'input', dataType: 'float32', shape: [1] }],
      outputs: [{ name: 'output', dataType: 'float32', shape: [1, 2] }],
      run: jest.fn(async () => [new Float32Array([0.1, 0.9]).buffer]),
      runSync,
    } as unknown as TensorflowModel;
    const { loadTensorflowModel } = jest.requireMock('react-native-fast-tflite') as {
      loadTensorflowModel: jest.Mock;
    };

    loadTensorflowModel.mockResolvedValue(model);

    const { classifyBraking } = require('./braking');
    const result = await classifyBraking({
      samples: new Float32Array([0.2, 0.3, 0.4]),
      sampleRate: 16_000,
      channelCount: 1,
    });

    expect(result.rawScores).toEqual([0.10000000149011612, 0.8999999761581421]);
    expect(result.probabilities).toEqual([0.10000000149011612, 0.8999999761581421]);
    expect(result.label).toBe('worn_out');
  });
});
