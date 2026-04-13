import os
from uuid import uuid4

from app.graph.nodes import (
    emit_ui_and_voice_node,
    evaluator_node,
    hitl_gate_node,
    ingest_input_node,
    intent_and_policy_node,
    parallel_context_node,
    personalization_context_node,
    repair_or_finalize_node,
    response_compose_node,
    retrieval_context_node,
    route_domain_node,
)
from app.graph.state import GraphState

try:
    from langgraph.graph import END, START, StateGraph
except Exception:  # pragma: no cover - fallback when langgraph is not installed yet.
    END = "END"
    START = "START"
    StateGraph = None


def _build_graph():
    if StateGraph is None:
        return None

    graph = StateGraph(GraphState)
    graph.add_node("ingest_input_node", ingest_input_node)
    graph.add_node("intent_and_policy_node", intent_and_policy_node)
    graph.add_node("parallel_context_node", parallel_context_node)
    graph.add_node("retrieval_context_node", retrieval_context_node)
    graph.add_node("personalization_context_node", personalization_context_node)
    graph.add_node("response_compose_node", response_compose_node)
    graph.add_node("route_domain_node", route_domain_node)
    graph.add_node("evaluator_node", evaluator_node)
    graph.add_node("repair_or_finalize_node", repair_or_finalize_node)
    graph.add_node("hitl_gate_node", hitl_gate_node)
    graph.add_node("emit_ui_and_voice_node", emit_ui_and_voice_node)

    graph.add_edge(START, "ingest_input_node")
    graph.add_edge("ingest_input_node", "intent_and_policy_node")
    graph.add_edge("intent_and_policy_node", "parallel_context_node")
    graph.add_edge("parallel_context_node", "retrieval_context_node")
    graph.add_edge("parallel_context_node", "personalization_context_node")
    graph.add_edge("retrieval_context_node", "response_compose_node")
    graph.add_edge("personalization_context_node", "response_compose_node")
    graph.add_edge("response_compose_node", "route_domain_node")
    graph.add_edge("route_domain_node", "evaluator_node")
    graph.add_conditional_edges(
        "evaluator_node",
        _after_evaluator,
        {
            "repair": "repair_or_finalize_node",
            "hitl": "hitl_gate_node",
            "emit": "emit_ui_and_voice_node",
        },
    )
    graph.add_conditional_edges(
        "repair_or_finalize_node",
        _after_repair,
        {
            "reroute": "route_domain_node",
            "emit": "emit_ui_and_voice_node",
        },
    )
    graph.add_edge("hitl_gate_node", "emit_ui_and_voice_node")
    graph.add_edge("emit_ui_and_voice_node", END)

    return graph.compile()


def _after_evaluator(state: GraphState) -> str:
    if not state.get("action_valid", False):
        return "repair"
    if os.getenv("KURAMA_HITL_ENABLED", "false").lower() == "true":
        return "hitl"
    return "emit"


def _after_repair(state: GraphState) -> str:
    if state.get("action_valid", False):
        return "emit"
    if state.get("retry_count", 0) <= state.get("max_retries", 1):
        return "reroute"
    return "emit"


GRAPH = _build_graph()


def run_graph(text: str, session_id: str | None) -> dict[str, object]:
    initial: GraphState = {
        "text": text,
        "session_id": session_id or "dev-session",
        "graph_trace_id": str(uuid4()),
        "graph_path": [],
        "max_retries": 1,
    }

    if GRAPH is not None:
        final = GRAPH.invoke(initial)
    else:
        final = ingest_input_node(initial)
        final = intent_and_policy_node(final)
        final = parallel_context_node(final)
        final = retrieval_context_node(final)
        final = personalization_context_node(final)
        final = response_compose_node(final)
        final = route_domain_node(final)
        final = evaluator_node(final)
        final = repair_or_finalize_node(final)
        final = emit_ui_and_voice_node(final)

    return {
        "speech_text": final["speech_text"],
        "intent": {"name": final["intent_name"], "confidence": final["intent_confidence"]},
        "ui_actions": final["ui_actions"],
        "graph_path": final["graph_path"],
        "graph_trace_id": final["graph_trace_id"],
        "sources": ["knowledge-base"],
    }
