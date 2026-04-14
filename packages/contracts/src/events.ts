import type { UIAction } from "./actions";

export type IntentName =
  | "about"
  | "projects"
  | "work"
  | "career_timeline"
  | "passions"
  | "blog"
  | "contact"
  | "website"
  | "general";

export interface IntentResult {
  name: IntentName;
  confidence: number;
}

export interface TranscriptEvent {
  session_id: string;
  text: string;
  is_final: boolean;
  timestamp: string;
}

export interface OrchestratorEnvelope {
  speech_text: string;
  ui_actions: UIAction[];
  intent: IntentResult;
  sources?: string[];
  graph_trace_id?: string;
  graph_path: string[];
}
