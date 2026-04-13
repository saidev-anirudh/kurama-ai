export const UI_ACTION_TYPES = [
  "navigate",
  "focus",
  "present",
  "theme_scene",
  "tour_mode",
] as const;

export type UIActionType = (typeof UI_ACTION_TYPES)[number];

export interface NavigateAction {
  type: "navigate";
  payload: { to: string };
}

export interface FocusAction {
  type: "focus";
  payload: { section: string };
}

export interface PresentAction {
  type: "present";
  payload: { component: string; props?: Record<string, unknown> };
}

export interface ThemeSceneAction {
  type: "theme_scene";
  payload: { scene: "home_hud" | "timeline_hud" | "blog_archive" | "contact_holo" };
}

export interface TourModeAction {
  type: "tour_mode";
  payload: { profile: "quick" | "deep" | "recruiter" | "founder" };
}

export type UIAction = NavigateAction | FocusAction | PresentAction | ThemeSceneAction | TourModeAction;
