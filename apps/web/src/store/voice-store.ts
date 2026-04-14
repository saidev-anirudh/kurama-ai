import { create } from "zustand";

export type KuramaMode = "idle" | "listening" | "thinking" | "speaking";

export interface TranscriptLine {
  id: string;
  role: "user" | "kurama";
  text: string;
}

type VoiceStore = {
  mode: KuramaMode;
  micAllowed: boolean;
  activeRoute: string;
  transcripts: TranscriptLine[];
  /** Last successful validate + orchestrate round-trip (ms). */
  lastPipelineMs: number | null;
  /** Last measured Next.js → speech token proxy RTT (ms). */
  linkRttMs: number | null;
  setMode: (mode: KuramaMode) => void;
  setMicAllowed: (value: boolean) => void;
  setActiveRoute: (route: string) => void;
  addTranscript: (line: TranscriptLine) => void;
  clearTranscripts: () => void;
  setVoiceMetrics: (partial: { lastPipelineMs?: number | null; linkRttMs?: number | null }) => void;
};

export const useVoiceStore = create<VoiceStore>((set) => ({
  mode: "idle",
  micAllowed: false,
  activeRoute: "/",
  transcripts: [],
  lastPipelineMs: null,
  linkRttMs: null,
  setMode: (mode) => set({ mode }),
  setMicAllowed: (value) => set({ micAllowed: value }),
  setActiveRoute: (route) => set({ activeRoute: route }),
  addTranscript: (line) =>
    set((state) => ({
      transcripts: [...state.transcripts.slice(-15), line],
    })),
  clearTranscripts: () => set({ transcripts: [] }),
  setVoiceMetrics: (partial) => set((state) => ({ ...state, ...partial })),
}));
