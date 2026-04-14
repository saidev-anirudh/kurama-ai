import { create } from "zustand";

/**
 * Imperative voice actions registered by AssistantShell so HUD components
 * outside the shell tree (Hero, nav) can trigger mic without prop drilling.
 */
type VoiceControlsStore = {
  ready: boolean;
  enableMic: () => Promise<void>;
};

export const useVoiceControls = create<VoiceControlsStore>(() => ({
  ready: false,
  enableMic: async () => {},
}));

export function registerVoiceControls(partial: Partial<VoiceControlsStore>) {
  useVoiceControls.setState(partial);
}
