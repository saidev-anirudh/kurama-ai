# Kurama AI

Futuristic, voice-first portfolio experience with a Jarvis-style assistant (`Kurama`) that can converse, route intent through a LangGraph orchestration pipeline, and navigate visitors across portfolio sections.

## What This Project Includes

- `Next.js` frontend with a sci-fi visual shell, route scene modes, and a central Kurama voice panel.
- `Go` gateway service for session endpoints, WebRTC signaling stubs, request guardrails, and orchestration forwarding.
- `Python` orchestrator service (`FastAPI + LangGraph`) for intent routing, policy checks, repair loops, and graph trace replay.
- Shared contract package for action and event schema alignment.
- Documentation for architecture, contracts, runtime graph behavior, and plan traceability.

## Monorepo Layout

- `apps/web`: frontend app (`Next.js`, TypeScript)
- `apps/gateway-go`: voice/session gateway (`Go`)
- `apps/api-go`: supplemental service API (`Go`)
- `apps/orchestrator-py`: multi-agent orchestration runtime (`Python`)
- `packages/contracts`: shared contracts/types
- `content/blog`: blog content placeholder
- `data/knowledge`: seed knowledge data for routing + retrieval
- `docs`: architecture, contracts, design, and implementation docs

## Core Flow

1. User opens web app and grants mic permissions.
2. Kurama introduces itself and accepts user queries.
3. Web app sends query to gateway `POST /orchestrate`.
4. Gateway applies auth/rate limit/trace middleware and forwards to orchestrator.
5. Orchestrator runs LangGraph nodes:
   - ingest
   - intent + policy
   - context fan-out (retrieval/personalization)
   - compose
   - route
   - evaluate
   - repair/finalize (conditional)
   - emit
6. UI actions (for example `navigate`) are returned and applied in frontend.
7. Graph checkpoint is persisted and replayable by `trace_id`.

## Local Development

### 1) Prerequisites

- Node 20+
- pnpm 9+
- Go 1.23+
- Python 3.12+
- Docker (optional, for compose workflow)

### 2) Environment

Copy and edit:

- `.env.example`

Relevant variables:

- `NEXT_PUBLIC_KURAMA_GATEWAY_URL`
- `KURAMA_API_TOKEN`
- `ORCHESTRATOR_URL`

### 3) Run Services (without Docker)

Frontend:

- `cd apps/web`
- `pnpm install`
- `pnpm dev`

Gateway:

- `cd apps/gateway-go`
- `go run ./cmd/server`

Orchestrator:

- `cd apps/orchestrator-py`
- `pip install -e .`
- `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

### 4) Run with Docker Compose

- `docker compose up --build`

## Testing and Validation

Go:

- `cd apps/gateway-go && go test ./...`
- `cd apps/api-go && go test ./...`

Python compile sanity:

- `cd apps/orchestrator-py && python3 -m py_compile app/main.py app/graph/runtime.py app/graph/nodes.py`

Python tests:

- `cd apps/orchestrator-py && pip install -e .[dev] && pytest -q`

## API Endpoints

Gateway:

- `GET /healthz`
- `POST /session/start`
- `POST /session/end`
- `GET /session/list`
- `POST /webrtc/offer`
- `POST /webrtc/answer`
- `POST /webrtc/ice`
- `POST /orchestrate`

Orchestrator:

- `GET /healthz`
- `POST /orchestrate`
- `GET /graph/replay/{trace_id}`

## Documentation Map

- `docs/architecture.md`: system architecture and service responsibilities
- `docs/contracts.md`: request/action/event contracts
- `docs/langgraph-runtime.md`: graph runtime details
- `docs/full-plan.md`: full architecture plan snapshot
- `docs/design-system-futuristic.md`: visual direction and design notes
- `docs/implementation-guide.md`: practical implementation and ops notes

## Current Status

Base platform is implemented with:

- frontend shell and core routes
- gateway session/signaling scaffolding + middleware
- LangGraph routing + conditional repair path + checkpoint replay
- shared contracts and initial data/docs

Next iterations should focus on real STT/TTS providers, richer domain agents, retrieval depth, and production deployment hardening.
