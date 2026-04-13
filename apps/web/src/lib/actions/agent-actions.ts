export type AgentAction =
  | { type: "navigate"; payload: { to: string } }
  | { type: "focus"; payload: { section: string } }
  | { type: "present"; payload: { component: string; props?: Record<string, unknown> } }
  | { type: "theme_scene"; payload: { scene: string } }
  | { type: "tour_mode"; payload: { profile: string } };

export function toRoute(action: AgentAction): string | null {
  if (action.type !== "navigate") {
    return null;
  }
  return action.payload.to;
}
