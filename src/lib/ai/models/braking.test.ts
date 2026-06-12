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
  const runSync = jest.fn(([input]: Float32Array[]) => {
    const average = input.reduce((sum, value) => sum + value, 0) / Math.max(1, input.length);

    return average >= 0.5
      ? [new Float32Array([4, 1])]
      : [new Float32Array([1, 4])];
  });

  return {
    delegate: 'default',
    inputs: [{ name: 'input', dataType: 'float32', shape: [1, 4] }],
    outputs: [{ name: 'output', dataType: 'float32', shape: [1, 2] }],
    run: jest.fn(async (input: Float32Array[]) => runSync(input)),
    runSync,
  };
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
    expect(model.runSync).toHaveBeenNthCalledWith(1, [quietInput.samples]);
    expect(model.runSync).toHaveBeenNthCalledWith(2, [loudInput.samples]);
  });
});
