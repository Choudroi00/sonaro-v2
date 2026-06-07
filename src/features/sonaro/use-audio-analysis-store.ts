import { create } from 'zustand';

export type AudioAnalysisInput = {
  durationMillis?: number;
  kind: 'file' | 'recording';
  mimeType?: string;
  name: string;
  size?: number;
  uri: string;
};

type AudioAnalysisState = {
  input: AudioAnalysisInput | null;
  clearInput: () => void;
  setInput: (input: AudioAnalysisInput) => void;
};

export const useAudioAnalysisStore = create<AudioAnalysisState>(set => ({
  input: null,
  clearInput: () => set({ input: null }),
  setInput: input => set({ input }),
}));
