from fastapi import FastAPI
from pydantic import BaseModel
from pathlib import Path
import json

from app.graph.runtime import run_graph
from app.memory.shared_memory import append_turn
from app.llm.validator import validate_utterance

app = FastAPI(title="Kurama Orchestrator")


class OrchestrateRequest(BaseModel):
    text: str
    session_id: str | None = None


class ValidateRequest(BaseModel):
    text: str


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/orchestrate")
def orchestrate(payload: OrchestrateRequest) -> dict[str, object]:
    print(f"[kurama-cli:user] {payload.text}")
    result = run_graph(payload.text, payload.session_id)
    print(f"[kurama-cli:assistant] {result.get('speech_text', '')}")
    append_turn(payload.text, str(result.get("speech_text", "")))
    return result


@app.post("/validate")
def validate(payload: ValidateRequest) -> dict[str, object]:
    result = validate_utterance(payload.text)
    print(f"[kurama-cli:validate] text={payload.text} result={result}")
    return result


@app.get("/graph/replay/{trace_id}")
def graph_replay(trace_id: str) -> dict[str, object]:
    checkpoint = Path(__file__).resolve().parent / "graph" / "checkpoints" / f"{trace_id}.json"
    if not checkpoint.exists():
        return {"status": "missing", "trace_id": trace_id}
    return json.loads(checkpoint.read_text(encoding="utf-8"))
