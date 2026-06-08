import type { AudioSample, AudioStatus } from 'expo-audio';
import type { TensorflowModel } from 'react-native-fast-tflite';

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { File } from 'expo-file-system';

const MODEL_SAMPLE_RATE = 16_000;
const PCM_FORMAT = 1;
const IEEE_FLOAT_FORMAT = 3;
const EXTENSIBLE_FORMAT = 0xFFFE;
const DEFAULT_DECODE_TIMEOUT_MS = 70_000;

type DecodedAudio = {
  samples: Float32Array;
  sampleRate: number;
  channelCount: number;
};

type WavFormat = {
  audioFormat: number;
  bitsPerSample: number;
  blockAlign: number;
  channelCount: number;
  sampleRate: number;
  subFormat?: number;
};

type WavData = {
  bytes: Uint8Array;
  dataOffset: number;
  dataSize: number;
  format: WavFormat;
  littleEndian: boolean;
  view: DataView;
};

type WavFormatChunk = {
  chunkSize: number;
  littleEndian: boolean;
  offset: number;
  view: DataView;
};

type DecodedAudioAccumulator = {
  channelCount: number;
  chunks: Float32Array[];
  frameCount: number;
  latestStatus: AudioStatus | null;
};

export type AudioPreprocessOptions = {
  normalize?: boolean;
  targetSampleRate?: number;
};

export type AudioDecodeOptions = {
  durationMillis?: number;
  maxDurationMillis?: number;
  sampleRateHint?: number;
  timeoutMillis?: number;
};

export type AudioUriInput = string | { uri: string };

export type AudioBytesInput = ArrayBuffer | Uint8Array;

export type DecodedAudioInput = {
  /** Interleaved PCM float samples in the original channel count/rate. */
  samples: Float32Array;
  sampleRate: number;
  channelCount: number;
};

export type AudioPreprocessInput = AudioUriInput | AudioBytesInput | DecodedAudioInput;

/**
 * Converts app audio into the raw waveform expected by the TFLite model:
 * mono, 16 kHz by default, Float32Array, normalized to [-1, 1].
 *
 * WAV inputs are decoded from bytes. Compressed URI inputs such as M4A/AAC are
 * decoded through Expo's native audio player sampling path before preprocessing.
 */
export async function preprocessAudio(
  input: AudioPreprocessInput,
  options: AudioPreprocessOptions & AudioDecodeOptions = {},
): Promise<Float32Array> {
  const decodedAudio = await decodeAudioInput(input, options);

  return preprocessDecodedAudio(decodedAudio, options);
}

export async function decodeAudioInput(
  input: AudioPreprocessInput,
  options: AudioDecodeOptions = {},
): Promise<DecodedAudioInput> {
  if (isDecodedAudioInput(input)) {
    return input;
  }

  if (isAudioUriInput(input)) {
    const bytes = await readAudioBytes(input);

    return isWavBytes(bytes)
      ? decodeWav(bytes)
      : decodeCompressedAudio(input, options);
  }

  return decodeWav(await readAudioBytes(input));
}

export async function decodeCompressedAudio(
  input: AudioUriInput,
  options: AudioDecodeOptions = {},
): Promise<DecodedAudioInput> {
  const source = normalizeAudioUri(typeof input === 'string' ? input : input.uri);
  const timeoutMillis = options.timeoutMillis ?? getDecodeTimeout(options);
  const accumulator: DecodedAudioAccumulator = {
    channelCount: 0,
    chunks: [],
    frameCount: 0,
    latestStatus: null,
  };

  await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

  const player = createAudioPlayer({ uri: source }, { updateInterval: 100 });

  if (!player.isAudioSamplingSupported) {
    player.remove();
    throw new Error('Native audio decoding is not supported on this device.');
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finishTimer = setTimeout(() => finish(), getMaxDecodeMillis(options));
    const timeout = setTimeout(() => {
      finish(new Error('Timed out while decoding audio.'));
    }, timeoutMillis);

    const sampleSubscription = player.addListener('audioSampleUpdate', (sample) => {
      appendDecodedSample(accumulator, sample);
    });
    const statusSubscription = player.addListener('playbackStatusUpdate', (status) => {
      accumulator.latestStatus = status;

      if (status.didJustFinish) {
        finish();
      }
    });

    const cleanup = () => {
      clearTimeout(finishTimer);
      clearTimeout(timeout);
      sampleSubscription.remove();
      statusSubscription.remove();
      player.setAudioSamplingEnabled(false);
      player.pause();
      player.remove();
    };

    const finish = (error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      if (error) {
        reject(error);
        return;
      }

      try {
        resolve(buildDecodedAudio(accumulator, options));
      }
      catch (decodeError) {
        reject(decodeError);
      }
    };

    try {
      player.volume = 0;
      player.setAudioSamplingEnabled(true);
      player.play();
    }
    catch (error) {
      finish(error instanceof Error ? error : new Error('Unable to decode audio.'));
    }
  });
}

export function preprocessDecodedAudio(
  decodedAudio: DecodedAudioInput,
  options: AudioPreprocessOptions = {},
): Float32Array {
  validateDecodedAudio(decodedAudio);

  const { normalize = true } = options;
  const targetSampleRate = getTargetSampleRate(options);
  const mono = downmixToMono(decodedAudio.samples, decodedAudio.channelCount);
  const resampled = resampleLinear(mono, decodedAudio.sampleRate, targetSampleRate);
  const finiteSamples = sanitizeSamples(resampled);

  return normalize ? normalizeSamples(finiteSamples) : finiteSamples;
}

export function runInference(
  model: TensorflowModel,
  preprocessedAudio: Float32Array,
): Float32Array {
  const outputs = model.runSync([float32ArrayToArrayBuffer(preprocessedAudio)]);

  if (!outputs || outputs.length === 0) {
    throw new Error('TFLite inference returned no outputs.');
  }

  return new Float32Array(outputs[0]);
}

async function readAudioBytes(input: AudioUriInput | AudioBytesInput): Promise<Uint8Array> {
  if (typeof input === 'string') {
    return readUriBytes(input);
  }

  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }

  if (input instanceof Uint8Array) {
    return input;
  }

  return readUriBytes(input.uri);
}

function appendDecodedSample(
  accumulator: DecodedAudioAccumulator,
  sample: AudioSample,
): void {
  const channelCount = sample.channels.length;

  if (channelCount === 0) {
    return;
  }

  const framesPerChannel = sample.channels[0]?.frames.length ?? 0;

  if (framesPerChannel === 0) {
    return;
  }

  if (accumulator.channelCount === 0) {
    accumulator.channelCount = channelCount;
  }

  const interleaved = new Float32Array(framesPerChannel * accumulator.channelCount);

  for (let frame = 0; frame < framesPerChannel; frame++) {
    for (let channel = 0; channel < accumulator.channelCount; channel++) {
      interleaved[frame * accumulator.channelCount + channel] = sample.channels[channel]?.frames[frame] ?? 0;
    }
  }

  accumulator.chunks.push(interleaved);
  accumulator.frameCount += framesPerChannel;
}

function buildDecodedAudio(
  accumulator: DecodedAudioAccumulator,
  options: AudioDecodeOptions,
): DecodedAudioInput {
  if (accumulator.channelCount === 0 || accumulator.frameCount === 0) {
    throw new Error('Decoded audio did not produce any PCM samples.');
  }

  const sampleRate = getDecodedSampleRate(accumulator, options);
  const samples = new Float32Array(accumulator.frameCount * accumulator.channelCount);
  let offset = 0;

  for (const chunk of accumulator.chunks) {
    samples.set(chunk, offset);
    offset += chunk.length;
  }

  return {
    samples,
    sampleRate,
    channelCount: accumulator.channelCount,
  };
}

function getDecodedSampleRate(
  accumulator: DecodedAudioAccumulator,
  options: AudioDecodeOptions,
): number {
  if (options.sampleRateHint) {
    return options.sampleRateHint;
  }

  if (options.durationMillis && options.durationMillis > 0) {
    return Math.max(1, Math.round(accumulator.frameCount / (options.durationMillis / 1000)));
  }

  const duration = accumulator.latestStatus?.duration;

  if (duration && duration > 0) {
    return Math.max(1, Math.round(accumulator.frameCount / duration));
  }

  return MODEL_SAMPLE_RATE;
}

function getDecodeTimeout(options: AudioDecodeOptions): number {
  return Math.max(
    DEFAULT_DECODE_TIMEOUT_MS,
    (options.durationMillis ?? options.maxDurationMillis ?? 0) + 10_000,
  );
}

function getMaxDecodeMillis(options: AudioDecodeOptions): number {
  return Math.max(1, options.maxDurationMillis ?? options.durationMillis ?? DEFAULT_DECODE_TIMEOUT_MS);
}

async function readUriBytes(uri: string): Promise<Uint8Array> {
  const source = normalizeAudioUri(uri);

  if (!isHttpUri(source) && !source.startsWith('data:')) {
    const buffer = await new File(source).arrayBuffer();

    if (buffer.byteLength === 0) {
      throw new Error('Audio file is empty.');
    }

    return new Uint8Array(buffer);
  }

  const response = await fetch(source);

  if (isHttpUri(source) && !response.ok) {
    throw new Error(`Unable to load audio file: HTTP ${response.status}`);
  }

  const buffer = await response.arrayBuffer();

  if (buffer.byteLength === 0) {
    throw new Error('Audio file is empty.');
  }

  return new Uint8Array(buffer);
}

function decodeWav(bytes: Uint8Array): DecodedAudio {
  if (bytes.byteLength < 44) {
    throwUnsupportedAudioFormat();
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const riffType = readAscii(view, 0, 4);
  const littleEndian = riffType === 'RIFF';

  if (riffType !== 'RIFF' && riffType !== 'RIFX') {
    throwUnsupportedAudioFormat();
  }

  if (readAscii(view, 8, 4) !== 'WAVE') {
    throwUnsupportedAudioFormat();
  }

  const wavData = readWavChunks(view, bytes, littleEndian);

  return decodeWavSamples(wavData);
}

function readWavChunks(
  view: DataView,
  bytes: Uint8Array,
  littleEndian: boolean,
): WavData {
  let offset = 12;
  let format: WavFormat | undefined;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= bytes.byteLength) {
    const chunkId = readAscii(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, littleEndian);
    const chunkOffset = offset + 8;
    const nextOffset = chunkOffset + chunkSize + (chunkSize % 2);

    if (chunkOffset + chunkSize > bytes.byteLength) {
      throw new Error('Invalid WAV file: chunk extends past file length.');
    }

    if (chunkId === 'fmt ') {
      format = readWavFormat({
        chunkSize,
        littleEndian,
        offset: chunkOffset,
        view,
      });
    }
    else if (chunkId === 'data') {
      dataOffset = chunkOffset;
      dataSize = chunkSize;
    }

    offset = nextOffset;
  }

  if (!format) {
    throw new Error('Invalid WAV file: missing fmt chunk.');
  }

  if (dataOffset < 0 || dataSize === 0) {
    throw new Error('Invalid WAV file: missing audio data.');
  }

  return { bytes, dataOffset, dataSize, format, littleEndian, view };
}

function readWavFormat(chunk: WavFormatChunk): WavFormat {
  const { chunkSize, littleEndian, offset, view } = chunk;

  if (chunkSize < 16) {
    throw new Error('Invalid WAV file: fmt chunk is too small.');
  }

  const audioFormat = view.getUint16(offset, littleEndian);
  const format: WavFormat = {
    audioFormat,
    channelCount: view.getUint16(offset + 2, littleEndian),
    sampleRate: view.getUint32(offset + 4, littleEndian),
    blockAlign: view.getUint16(offset + 12, littleEndian),
    bitsPerSample: view.getUint16(offset + 14, littleEndian),
  };

  if (audioFormat === EXTENSIBLE_FORMAT) {
    if (chunkSize < 40) {
      throw new Error('Invalid WAV file: extensible fmt chunk is too small.');
    }

    return {
      ...format,
      subFormat: view.getUint16(offset + 24, littleEndian),
    };
  }

  return format;
}

function decodeWavSamples(wavData: WavData): DecodedAudio {
  const { dataOffset, dataSize, format } = wavData;
  const encoding = resolveWavEncoding(format);
  const bytesPerSample = format.bitsPerSample / 8;

  validateWavFormat(format, bytesPerSample, encoding);

  const frameCount = Math.floor(dataSize / format.blockAlign);
  const samples = new Float32Array(frameCount * format.channelCount);
  let outputIndex = 0;

  for (let frame = 0; frame < frameCount; frame++) {
    const frameOffset = dataOffset + frame * format.blockAlign;

    for (let channel = 0; channel < format.channelCount; channel++) {
      const sampleOffset = frameOffset + channel * bytesPerSample;
      samples[outputIndex] = readWavSample(wavData, sampleOffset, encoding);
      outputIndex++;
    }
  }

  return {
    samples,
    sampleRate: format.sampleRate,
    channelCount: format.channelCount,
  };
}

function readWavSample(wavData: WavData, offset: number, encoding: number): number {
  const { format, littleEndian } = wavData;

  if (encoding === IEEE_FLOAT_FORMAT) {
    if (format.bitsPerSample === 32) {
      return finiteOrZero(wavData.view.getFloat32(offset, littleEndian));
    }

    return finiteOrZero(wavData.view.getFloat64(offset, littleEndian));
  }

  switch (format.bitsPerSample) {
    case 8:
      return (wavData.bytes[offset] - 128) / 128;
    case 16:
      return wavData.view.getInt16(offset, littleEndian) / 32_768;
    case 24:
      return readInt24(wavData.bytes, offset, littleEndian) / 8_388_608;
    case 32:
      return wavData.view.getInt32(offset, littleEndian) / 2_147_483_648;
    default:
      throw new Error(`Unsupported WAV bit depth: ${format.bitsPerSample}`);
  }
}

function validateWavFormat(
  format: WavFormat,
  bytesPerSample: number,
  encoding: number,
): void {
  if (format.channelCount < 1 || format.sampleRate < 1) {
    throw new Error('Invalid WAV file: sample rate or channel count is invalid.');
  }

  if (!Number.isInteger(bytesPerSample) || bytesPerSample < 1) {
    throw new Error(`Unsupported WAV bit depth: ${format.bitsPerSample}`);
  }

  if (format.blockAlign < format.channelCount * bytesPerSample) {
    throw new Error('Invalid WAV file: block alignment is too small.');
  }

  if (encoding !== PCM_FORMAT && encoding !== IEEE_FLOAT_FORMAT) {
    throw new Error('Unsupported WAV encoding. Use uncompressed PCM or IEEE-float WAV.');
  }

  if (encoding === IEEE_FLOAT_FORMAT && format.bitsPerSample !== 32 && format.bitsPerSample !== 64) {
    throw new Error(`Unsupported WAV float bit depth: ${format.bitsPerSample}`);
  }
}

function resolveWavEncoding(format: WavFormat): number {
  return format.audioFormat === EXTENSIBLE_FORMAT
    ? format.subFormat ?? 0
    : format.audioFormat;
}

function downmixToMono(samples: Float32Array, channelCount: number): Float32Array {
  if (channelCount === 1) {
    return samples;
  }

  const frameCount = Math.floor(samples.length / channelCount);
  const mono = new Float32Array(frameCount);

  for (let frame = 0; frame < frameCount; frame++) {
    let sum = 0;

    for (let channel = 0; channel < channelCount; channel++) {
      sum += samples[frame * channelCount + channel];
    }

    mono[frame] = sum / channelCount;
  }

  return mono;
}

function resampleLinear(
  samples: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number,
): Float32Array {
  if (samples.length === 0 || sourceSampleRate === targetSampleRate) {
    return samples;
  }

  const outputLength = Math.max(1, Math.round(samples.length * targetSampleRate / sourceSampleRate));
  const output = new Float32Array(outputLength);
  const rateRatio = sourceSampleRate / targetSampleRate;

  for (let i = 0; i < outputLength; i++) {
    const sourceIndex = i * rateRatio;
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.min(lowerIndex + 1, samples.length - 1);
    const weight = sourceIndex - lowerIndex;

    output[i] = samples[lowerIndex] * (1 - weight) + samples[upperIndex] * weight;
  }

  return output;
}

function sanitizeSamples(samples: Float32Array): Float32Array {
  let hasInvalidSample = false;

  for (let i = 0; i < samples.length; i++) {
    if (!Number.isFinite(samples[i])) {
      hasInvalidSample = true;
      break;
    }
  }

  if (!hasInvalidSample) {
    return samples;
  }

  const sanitized = new Float32Array(samples.length);

  for (let i = 0; i < samples.length; i++) {
    sanitized[i] = finiteOrZero(samples[i]);
  }

  return sanitized;
}

function normalizeSamples(samples: Float32Array): Float32Array {
  let maxAbs = 0;

  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > maxAbs) {
      maxAbs = abs;
    }
  }

  if (maxAbs === 0) {
    return samples;
  }

  const normalized = new Float32Array(samples.length);

  for (let i = 0; i < samples.length; i++) {
    normalized[i] = samples[i] / maxAbs;
  }

  return normalized;
}

function validateDecodedAudio(decodedAudio: DecodedAudioInput): void {
  if (!(decodedAudio.samples instanceof Float32Array)) {
    throw new TypeError('Decoded audio samples must be a Float32Array.');
  }

  if (!Number.isFinite(decodedAudio.sampleRate) || decodedAudio.sampleRate <= 0) {
    throw new Error('Decoded audio sample rate must be a positive number.');
  }

  if (!Number.isInteger(decodedAudio.channelCount) || decodedAudio.channelCount < 1) {
    throw new Error('Decoded audio channel count must be a positive integer.');
  }

  if (decodedAudio.samples.length % decodedAudio.channelCount !== 0) {
    throw new Error('Decoded audio samples must be interleaved by channel.');
  }
}

function getTargetSampleRate(options: AudioPreprocessOptions): number {
  const targetSampleRate = options.targetSampleRate ?? MODEL_SAMPLE_RATE;

  if (!Number.isInteger(targetSampleRate) || targetSampleRate <= 0) {
    throw new Error('Target sample rate must be a positive integer.');
  }

  return targetSampleRate;
}

function readInt24(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  const first = bytes[offset];
  const second = bytes[offset + 1];
  const third = bytes[offset + 2];
  const unsigned = littleEndian
    ? first | (second << 8) | (third << 16)
    : third | (second << 8) | (first << 16);

  return unsigned & 0x80_0000 ? unsigned | 0xFF00_0000 : unsigned;
}

function readAscii(view: DataView, offset: number, length: number): string {
  let value = '';

  for (let i = 0; i < length; i++) {
    value += String.fromCharCode(view.getUint8(offset + i));
  }

  return value;
}

function isDecodedAudioInput(input: AudioPreprocessInput): input is DecodedAudioInput {
  return typeof input === 'object'
    && input !== null
    && 'samples' in input
    && 'sampleRate' in input
    && 'channelCount' in input;
}

function isAudioUriInput(input: AudioPreprocessInput): input is AudioUriInput {
  return typeof input === 'string'
    || (typeof input === 'object'
      && input !== null
      && 'uri' in input
      && typeof input.uri === 'string');
}

function isWavBytes(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 12) {
    return false;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const riffType = readAscii(view, 0, 4);

  return (riffType === 'RIFF' || riffType === 'RIFX') && readAscii(view, 8, 4) === 'WAVE';
}

function normalizeAudioUri(uri: string): string {
  const trimmedUri = uri.trim();

  if (trimmedUri.length === 0) {
    throw new Error('Audio URI cannot be empty.');
  }

  return /^[a-z][a-z\d+.-]*:/i.test(trimmedUri)
    ? trimmedUri
    : `file://${trimmedUri}`;
}

function isHttpUri(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function float32ArrayToArrayBuffer(samples: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(samples.byteLength);
  new Float32Array(buffer).set(samples);

  return buffer;
}

function throwUnsupportedAudioFormat(): never {
  throw new Error(
    'Unsupported audio format. Expected a RIFF/WAVE .wav file. Recordings must be WAV PCM/float; compressed audio such as M4A/AAC must be decoded before preprocessing.',
  );
}
