# Architecture

## System Overview

Kurama AI is a voice-first portfolio platform with a polyglot backend:

- Frontend experience in `Next.js`
- Voice/session gateway in `Go`
- Multi-agent orchestration in `Python + LangGraph`

The platform is designed for immediate managed-provider usage and clean migration to self-hosted mini models later.

## Runtime Topology

1. Browser opens the web app and starts interaction with Kurama UI.
2. Browser requests session lifecycle endpoints from gateway.
3. Browser submits a voice/text request through gateway orchestration endpoint.
4. Gateway enforces middleware:
   - trace id
   - optional auth token
   - rate limit
   - CORS
5. Gateway forwards payload to orchestrator service.
6. Orchestrator runs LangGraph policy flow and emits:
   - `speech_text`
   - `ui_actions`
   - `intent`
   - `graph_trace_id`
   - `graph_path`
7. Frontend applies actions (navigation/focus/present/theme/tour).
8. Orchestrator writes checkpoint for replay.

## Service Responsibilities

### `apps/web`

- Kurama orb interaction states (`idle/listening/thinking/speaking`)
- voice query capture and transcript rendering
- route scene handling (`home_hud`, `timeline_hud`, `blog_archive`, `contact_holo`)
- route pages (`about`, `projects`, `career-timeline`, `passions`, `blog`, `labs`, `now`, `contact`)

### `apps/gateway-go`

- session lifecycle endpoints (`start`, `end`, `list`)
- signaling stubs (`offer`, `answer`, `ice`)
- provider adapter abstraction (`managed` / `self_hosted`)
- orchestration proxy endpoint
- middleware-based baseline hardening

### `apps/orchestrator-py`

- FastAPI orchestration interface
- LangGraph nodes with conditional and repair behavior
- optional HITL gate (`KURAMA_HITL_ENABLED`)
- replay endpoint using checkpoint trace ids

## LangGraph Execution Model

Default graph path:

1. `ingest_input_node`
2. `intent_and_policy_node`
3. `parallel_context_node`
4. `retrieval_context_node`
5. `personalization_context_node`
6. `response_compose_node`
7. `route_domain_node`
8. `evaluator_node`
9. `repair_or_finalize_node` (conditional)
10. `hitl_gate_node` (conditional)
11. `emit_ui_and_voice_node`

## Data and Knowledge

- Structured knowledge seeds in `data/knowledge`
- route and response grounding from profile/project/timeline context
- checkpoint artifacts in `apps/orchestrator-py/app/graph/checkpoints`

## Deployment Shape

- Local: direct process launch or Docker Compose
- Production target: containerized services behind ingress/load balancing
- Observability baseline: trace ids + service logs (expand to OTEL/Grafana stack in next phase)
