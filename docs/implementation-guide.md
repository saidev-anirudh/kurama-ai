# Implementation Guide

## What Is Implemented

### Frontend

- Voice command center with Kurama orb and live transcript UI
- Quick route command chips
- Text query to gateway orchestration endpoint
- Expanded page surface:
  - home
  - about
  - projects
  - career timeline
  - passions
  - blog
  - labs
  - now
  - contact

### Gateway (`Go`)

- Session lifecycle handlers and in-memory session map
- Provider adapter abstraction:
  - managed provider profile
  - self-hosted provider profile
- Signal endpoints scaffold
- Middleware:
  - trace logging
  - token auth (env controlled)
  - rate limiting
  - CORS
- Orchestration pass-through to Python service

### Orchestrator (`Python`)

- LangGraph orchestration runtime
- Intent classification and policy checks
- Context fan-out nodes for retrieval and personalization
- Evaluator and repair loop
- Toggleable HITL gate
- Trace-id checkpoint persistence + replay endpoint

## Required Next Integrations

1. Replace signaling stubs with full WebRTC session handling.
2. Integrate managed STT/TTS realtime providers.
3. Add retrieval backend (Postgres/Redis/Qdrant wiring).
4. Add structured domain agent modules (`Bio`, `Projects`, `Timeline`, etc.).
5. Add frontend event stream (SSE/WebSocket) for realtime action updates.

## Operational Guidelines

- Keep `KURAMA_API_TOKEN` enabled outside localhost testing.
- Validate rate limit windows for expected demo traffic.
- Rotate provider credentials through managed secrets.
- Retain checkpoint logs for debugging only; redact sensitive user text if needed.

## Suggested Release Path

1. **Alpha**: team-only internal demo with text queries.
2. **Beta**: mic + managed STT/TTS integration + public route navigation.
3. **RC**: retrieval grounding and detailed domain agent coverage.
4. **Production**: full observability, CI/CD, and deployment hardening.
