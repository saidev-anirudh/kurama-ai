from fastapi import FastAPI
from pydantic import BaseModel
from pathlib import Path
import json

from app.graph.runtime import run_graph

app = FastAPI(title="Kurama Orchestrator")


class OrchestrateRequest(BaseModel):
    text: str
    session_id: str | None = None


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/orchestrate")
def orchestrate(payload: OrchestrateRequest) -> dict[str, object]:
    return run_graph(payload.text, payload.session_id)


@app.get("/graph/replay/{trace_id}")
def graph_replay(trace_id: str) -> dict[str, object]:
    checkpoint = Path(__file__).resolve().parent / "graph" / "checkpoints" / f"{trace_id}.json"
    if not checkpoint.exists():
        return {"status": "missing", "trace_id": trace_id}
    return json.loads(checkpoint.read_text(encoding="utf-8"))
