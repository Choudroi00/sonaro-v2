import { create } from 'zustand';

import type { ModelClassificationResult } from '@/lib/ai/models';

export type AudioAnalysisInput = {
  durationMillis?: number;
  kind: 'file' | 'recording';
  mimeType?: string;
  name: string;
  size?: number;
  uri: string;
};

type AudioAnalysisState = {
  clearInput: () => void;
  clearResults: () => void;
  input: AudioAnalysisInput | null;
  results: ModelClassificationResult[];
  setInput: (input: AudioAnalysisInput) => void;
  setResults: (results: ModelClassificationResult[]) => void;
};

export const useAudioAnalysisStore = create<AudioAnalysisState>(set => ({
  clearInput: () => set({ input: null }),
  clearResults: () => set({ results: [] }),
  input: null,
  results: [],
  setInput: input => set({ input }),
  setResults: results => set({ results }),
}));
