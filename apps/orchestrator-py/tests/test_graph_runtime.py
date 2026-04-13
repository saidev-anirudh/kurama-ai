from app.graph.runtime import run_graph


def test_projects_route_contains_graph_path() -> None:
    result = run_graph("Show me Sai projects", session_id="test-1")
    actions = result["ui_actions"]
    assert actions
    assert actions[0]["type"] == "navigate"
    assert actions[0]["payload"]["to"] == "/projects"
    assert "evaluator_node" in result["graph_path"]


def test_low_confidence_request_falls_back_safely() -> None:
    result = run_graph("???", session_id="test-2")
    assert result["ui_actions"]
    assert "repair_or_finalize_node" in result["graph_path"] or result["intent"]["name"] in {
        "about",
        "general",
    }
