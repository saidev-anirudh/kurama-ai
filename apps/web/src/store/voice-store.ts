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
  setMode: (mode: KuramaMode) => void;
  setMicAllowed: (value: boolean) => void;
  setActiveRoute: (route: string) => void;
  addTranscript: (line: TranscriptLine) => void;
  clearTranscripts: () => void;
};

export const useVoiceStore = create<VoiceStore>((set) => ({
  mode: "idle",
  micAllowed: false,
  activeRoute: "/",
  transcripts: [],
  setMode: (mode) => set({ mode }),
  setMicAllowed: (value) => set({ micAllowed: value }),
  setActiveRoute: (route) => set({ activeRoute: route }),
  addTranscript: (line) =>
    set((state) => ({
      transcripts: [...state.transcripts.slice(-15), line],
    })),
  clearTranscripts: () => set({ transcripts: [] }),
}));
