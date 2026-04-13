# Kurama Voice Portfolio - Full Architecture Plan

## 1) Product Vision and Experience
Build a cinematic, futuristic portfolio where visitors primarily interact through voice. `Kurama` is the front-door assistant that greets users, understands intent, triggers agent workflows, and navigates users to the correct sections (projects, bio, work, passions, contact) while narrating context in real time.

Core UX loop:
1. User lands on homepage and grants microphone permission.
2. Kurama introduces itself and prompts user intent.
3. Voice stream flows to realtime AI pipeline (STT/LLM orchestration/TTS).
4. Multi-agent system resolves intent + gathers relevant data.
5. Frontend receives structured navigation/action events and transitions to the target UI panels.
6. Kurama continues context-aware conversation and supports follow-up questions.

Design personality:
- Sci-fi command-center feel with deep-space/cyberpunk background layers.
- `Kurama` visual identity as orange hologram (Jarvis-inspired, but unique).
- Motion-first UI where voice interactions trigger contextual ambient effects.

---

## 2) Recommended Stack (opinionated)

### Frontend
- `Next.js` (App Router) + `TypeScript`
- `Tailwind CSS` + `Framer Motion` (+ optional `Three.js` for futuristic visuals)
- `WebRTC + Web Audio API` for low-latency voice stream handling and modulation effects
- `Zustand` for lightweight state machine (voice session, UI mode, active intent)
- `MDX` content pipeline for blogs, career stories, and long-form writing

### Backend (polyglot)
- `Golang` services for realtime transport, session management, auth, and high-concurrency APIs
- `Python` services for `LangGraph` orchestration, tool routing, memory enrichment, and retrieval workflows
- Event bus: `NATS` (or Redis Streams initially)
- Data: `PostgreSQL` (profiles/session metadata), `Redis` (hot cache/session state), optional vector DB (`Qdrant`) for memory/retrieval

### Agent Framework
- `LangGraph` (`StateGraph`) as the orchestration runtime
- `LangChain` tool adapters and model abstraction for provider swapping
- Graph checkpoints + execution traces for debugging and observability

### Voice Runtime (hybrid)
- **Now**: Managed providers via API keys (Realtime LLM, STT, TTS)
- **Later**: Drop-in adapters for self-hosted STT/TTS/LLM mini models (same interface contracts)

### Tech Stack Details (complete, practical defaults)
- Frontend app/runtime: `Next.js 15+`, `React 19`, `TypeScript 5`
- Styling/motion/3D: `Tailwind CSS`, `Framer Motion`, optional `Three.js` + `React Three Fiber`
- Frontend validation/schemas: `Zod`
- Frontend state: `Zustand`
- Content/blog: `MDX` + `remark/rehype` pipeline
- Go services: `Go 1.23+`, `gin` or `chi`, `pion/webrtc`, `gorilla/websocket`
- Python services: `Python 3.12+`, `FastAPI`, `LangGraph`, `LangChain`, `Pydantic v2`
- Messaging/eventing: `NATS` (default), fallback `Redis Streams`
- Data stores: `PostgreSQL 16`, `Redis 7`, optional `Qdrant`
- Object storage (optional): `S3`-compatible bucket for media/log artifacts
- Observability: `OpenTelemetry`, `Prometheus`, `Grafana`, `Loki`
- Testing: `Vitest` + `Playwright` (web), `pytest` (python), `go test` (go)
- CI/CD: `GitHub Actions` (lint/test/build/deploy), `Docker` images per service
- Deployment baseline: `Docker Compose` for local, `Kubernetes` for production
- Secrets/config: `.env` for local + managed secret manager in cloud
- Auth/session: short-lived JWT session tokens + CSRF-safe web flows

---

## 3) High-Level System Architecture

```mermaid
flowchart LR
  Visitor[WebsiteVisitor] --> FrontendApp[NextjsFrontend]
  FrontendApp -->|MicAudio(WebRTC)| VoiceGateway[GoVoiceGateway]
  VoiceGateway -->|AudioChunks| VoiceProvider[ManagedRealtimeProvider]
  VoiceGateway --> PythonOrchestrator[PythonAgentOrchestrator]
  PythonOrchestrator --> LangGraphRuntime[LangGraphStateGraphRuntime]
  LangGraphRuntime --> RouterAgent[IntentRouterAgent]
  RouterAgent --> BioAgent[BioAgent]
  RouterAgent --> WorkAgent[WorkAgent]
  RouterAgent --> ProjectsAgent[ProjectsAgent]
  RouterAgent --> ContactAgent[ContactAgent]
  LangGraphRuntime --> EvalNode[ResponseEvaluatorNode]
  EvalNode -->|LowConfidence| RepairNode[RepairAndRetryNode]
  RepairNode --> RouterAgent
  PythonOrchestrator --> MemoryLayer[MemoryAndRetrieval]
  MemoryLayer --> PostgresDB[Postgres]
  MemoryLayer --> RedisCache[Redis]
  MemoryLayer --> VectorStore[QdrantOptional]
  PythonOrchestrator --> ActionAPI[NavigationActionPublisher]
  ActionAPI --> FrontendApp
  VoiceProvider -->|TTSAudio| VoiceGateway
  VoiceGateway -->|PlaybackStream| FrontendApp
```

---

## 4) Core Services and Responsibilities

### A) Frontend Experience Layer
- Futuristic shell UI with animated panels and context transitions.
- Central `Kurama Orb` voice widget:
  - mic state
  - waveform/reactive lighting
  - speaking/listening indicators
  - live transcripts
- Receives `agent_action` events (JSON) to:
  - route pages
  - open sections/modals
  - highlight timeline/project cards
  - trigger contextual animations

Visual system (futuristic + hologram):
- Background stack: starfield shader + subtle parallax nebula + scanline/post-processing layer.
- Primary palette: dark graphite base with orange hologram accents for Kurama states.
- Hologram effects: additive glow rings, volumetric pulse, waveform arcs, micro-particle trails.
- Interaction states:
  - `idle`: low pulse halo
  - `listening`: expanding orange radial ripples
  - `thinking`: segmented rotating rings + transcript shimmer
  - `speaking`: audio-reactive waveform around orb
- Accessibility mode: reduced motion + high contrast + keyboard-first equivalent controls.

### B) Go Realtime Voice Gateway
- Terminates WebRTC sessions from browser.
- Manages low-latency audio streaming to provider adapters.
- Tracks session lifecycle, reconnects, heartbeat, and rate controls.
- Emits normalized transcript + audio output events to frontend.
- Forwards user utterances and context payloads to Python orchestrator.

### C) Python Multi-Agent Orchestrator
- Intent classification + confidence scoring.
- `LangGraph` policy graph and tool orchestration.
- RAG/memory retrieval for deep questions about Sai.
- Produces structured responses:
  - natural language reply text
  - optional TTS style instructions
  - UI action contract (`navigate`, `focus`, `compare`, `showcase`)

LangGraph-specific responsibilities:
- Manage typed shared state (`conversation_state`) across nodes.
- Execute conditional edges (intent, confidence, policy checks).
- Run safe parallel branches (retrieval + personalization + UI planning).
- Apply retries/fallback edges when tools or providers fail.
- Persist checkpoints for replay and postmortem analysis.

### D) Data and Memory
- Canonical personal knowledge base (bio, work, projects, passions, achievements).
- Session memory for conversational continuity (short-term).
- Retrieval memory for deep factual recall (long-term embeddings).

---

## 5) Agent Topology (initial set)

1. `RouterAgent`
   - maps utterances to intents + target domain
2. `BioAgent`
   - life story, background, journey narrative
3. `WorkAgent`
   - professional roles, impact, leadership, metrics
4. `ProjectsAgent`
   - technical deep-dives, architecture narratives, demos
5. `PassionsAgent`
   - interests, goals, personal philosophy
6. `ContactAgent`
   - CTA flow: connect, email, scheduling
7. `NarrationAgent` (optional)
   - controls tone/personality and keeps Kurama voice consistent
8. `BlogAgent`
   - fetches/summarizes posts and recommends reads by topic
9. `TimelineAgent`
   - narrates career journey and jumps to time-specific milestones
10. `NavigationAgent`
   - interprets global commands (go back, compare pages, open section)

Design note: Keep agents behind a single orchestrator contract so you can swap implementations without frontend changes.

### LangGraph Node Topology (recommended)
1. `ingest_input_node`
2. `intent_and_policy_node`
3. `route_domain_node`
4. `parallel_context_node`
5. `response_compose_node`
6. `evaluator_node`
7. `repair_or_finalize_node`
8. `emit_ui_and_voice_node`

### Learning-First Advanced Graph Patterns
- Conditional edges by confidence thresholds and intent risk.
- Subgraphs per domain for cleaner maintenance and versioning.
- Parallel fan-out/fan-in for retrieval and action planning.
- Guardrail nodes for prompt injection and unsafe command suppression.
- Human-in-the-loop node (toggleable) for curated demo sessions.
- Time-travel replay using checkpoints to inspect why a route was chosen.

### Website Capability Map (agent -> page features)
- `BioAgent` -> `/about`, `/passions`, `/values`, `/faq`
- `WorkAgent` -> `/experience`, `/impact`, `/leadership`
- `ProjectsAgent` -> `/projects`, `/labs`, `/demos`, project compare mode
- `BlogAgent` -> `/blog`, `/blog/[slug]`, topic-based discovery and summaries
- `TimelineAgent` -> `/career-timeline`, milestone drill-downs and storytelling mode
- `ContactAgent` -> `/contact`, social links, collaboration intent capture
- `NavigationAgent` -> global layout/state controls and contextual shortcuts

---

## 6) Website Information Architecture and Feature Set

Primary routes:
- `/`
- `/about`
- `/projects`
- `/career-timeline`
- `/passions`
- `/blog`
- `/contact`
- `/labs`
- `/now`

High-value futuristic features:
- Voice-first navigation with typed fallback command palette.
- Interactive command deck (chips + slash commands + keyboard shortcuts).
- Story mode: Kurama gives guided tours (`quick`, `deep`, `recruiter`, `founder`).
- Dynamic scene transitions per route.
- Terminal-console panel for power users.
- Ambient soundtrack toggle + sound design cues.
- Resume and portfolio export actions.

Content and engagement features:
- MDX blog with taxonomy and related posts.
- Contact intent routing.
- FAQ autopilot.
- Session recap card.

---

## 7) API and Event Contracts

### Browser -> Backend
- `POST /session/start`
- `POST /session/end`
- `/webrtc/offer`, `/webrtc/answer`, `/webrtc/ice`

### Orchestrator response envelope
- `speech_text`
- `ui_actions`
- `intent`
- `sources`
- `graph_trace_id`
- `graph_path`

### UI action examples
- `navigate:{"to":"/projects"}`
- `focus:{"section":"ai-platform"}`
- `present:{"component":"career-timeline"}`
- `theme_scene:{"scene":"timeline_hud"}`
- `tour_mode:{"profile":"recruiter"}`

---

## 8) Security and Reliability
- API-key vaulting via environment-based secret manager.
- Tokenized short-lived session auth between frontend and gateway.
- PII-safe logs; redact transcripts by policy if needed.
- Rate limits + abuse protection on voice endpoints.
- Circuit breakers around provider APIs.
- Full adapter abstraction for provider failover.

---

## 9) Migration Path: Managed -> Self-Hosted
- Phase 1: managed providers.
- Phase 2: selective self-hosted STT/TTS.
- Phase 3: optional self-hosted mini LLM + hybrid fallback.

---

## 10) Proposed Monorepo Directory Structure

See repository structure in `README.md` and architecture docs for current mapped implementation across:
- `apps/web`
- `apps/gateway-go`
- `apps/api-go`
- `apps/orchestrator-py`
- `packages/contracts`
- `data/knowledge`
- `docs`

---

## 11) Delivery Plan

1. Foundation
2. Voice MVP
3. Multi-Agent Intelligence
4. Graph Mastery and Agentic Rigor
5. Production Hardening
6. Hybrid Expansion
7. Signature Futuristic Experience

---

## 12) Success Criteria
- Low-latency first response.
- Stable voice turn-taking.
- Accurate intent routing.
- Reliable page navigation.
- Graph trace reproducibility.
- Strong eval pass rate.
- Distinct futuristic visual identity.

---

## 13) Immediate Next Implementation Step
`voice -> graph route -> navigate -> speak` with progressively deeper provider and retrieval integrations.
