from fastapi import FastAPI
from pydantic import BaseModel

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
