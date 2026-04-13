# Contracts

## Orchestrator Response Envelope

`POST /orchestrate` returns:

- `speech_text: string`
- `ui_actions: UIAction[]`
- `intent: { name: IntentName; confidence: number }`
- `sources?: string[]`
- `graph_trace_id?: string`
- `graph_path: string[]`

## Intent Names

- `about`
- `projects`
- `work`
- `career_timeline`
- `passions`
- `blog`
- `contact`
- `general`

## UI Action Types

- `navigate`
  - payload: `{ to: string }`
- `focus`
  - payload: `{ section: string }`
- `present`
  - payload: `{ component: string; props?: Record<string, unknown> }`
- `theme_scene`
  - payload: `{ scene: "home_hud" | "timeline_hud" | "blog_archive" | "contact_holo" }`
- `tour_mode`
  - payload: `{ profile: "quick" | "deep" | "recruiter" | "founder" }`

## Gateway Request Surfaces

- `POST /session/start`
- `POST /session/end`
- `GET /session/list`
- `POST /webrtc/offer`
- `POST /webrtc/answer`
- `POST /webrtc/ice`
- `POST /orchestrate`

## Trace + Replay Contract

- Each orchestration run generates `graph_trace_id`
- Full graph output snapshot is checkpointed under orchestrator graph checkpoint storage
- Replay endpoint:
  - `GET /graph/replay/{trace_id}`
