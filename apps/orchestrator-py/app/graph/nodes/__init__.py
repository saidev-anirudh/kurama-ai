from app.agents.router_agent import classify_intent
from app.graph.state import GraphState
from app.llm.azure_openai import generate_kurama_reply
from app.memory.shared_memory import summarize_recent


def _contains_contact_draft_request(text: str) -> bool:
    normalized = text.lower()
    trigger_terms = ("send a message", "draft a message", "write an email", "send an email", "mail him", "contact sai")
    return any(term in normalized for term in trigger_terms)


def _extract_contact_draft(text: str) -> dict[str, str]:
    cleaned = text.strip()
    lowered = cleaned.lower()
    for lead in (
        "send a message to sai saying",
        "draft a message to sai saying",
        "write an email to sai saying",
        "send an email to sai saying",
        "mail him saying",
    ):
        if lowered.startswith(lead):
            cleaned = cleaned[len(lead) :].strip(" .,:;-")
            break
    if not cleaned:
        cleaned = "Hi Sai, I would like to connect with you regarding a potential collaboration opportunity."
    subject = "Message from portfolio visitor"
    return {"subject": subject, "body": cleaned}


def ingest_input_node(state: GraphState) -> GraphState:
    state["graph_path"] = [*state.get("graph_path", []), "ingest_input_node"]
    state["retry_count"] = state.get("retry_count", 0)
    state["max_retries"] = state.get("max_retries", 1)
    return state


def intent_and_policy_node(state: GraphState) -> GraphState:
    intent_name, confidence = classify_intent(state["text"])
    state["intent_name"] = intent_name
    state["intent_confidence"] = confidence
    text = state.get("text", "").lower()
    unsafe_patterns = ("rm -rf", "drop table", "delete all")
    state["is_safe"] = not any(p in text for p in unsafe_patterns)
    state["requires_human_approval"] = "approve" in text or "override" in text
    state["graph_path"] = [*state.get("graph_path", []), "intent_and_policy_node"]
    return state


def retrieval_context_node(state: GraphState) -> GraphState:
    state["retrieval_context"] = {
        "knowledge_source": "profile+projects+timeline",
        "confidence_boost": 0.08,
    }
    state["website_context"] = {
        "supported_routes": ["/", "/about", "/projects", "/career-timeline", "/blog", "/contact"],
        "contact_flow": "voice draft -> review -> send",
        "blog_connector": "medium feed",
    }
    state["graph_path"] = [*state.get("graph_path", []), "retrieval_context_node"]
    return state


def personalization_context_node(state: GraphState) -> GraphState:
    state["personalization_context"] = {
        "persona": "kurama_orange_hologram",
        "tone": "friendly_futuristic",
    }
    state["memory_summary"] = summarize_recent()
    state["graph_path"] = [*state.get("graph_path", []), "personalization_context_node"]
    return state


def parallel_context_node(state: GraphState) -> GraphState:
    state["graph_path"] = [*state.get("graph_path", []), "parallel_context_node"]
    return state


def response_compose_node(state: GraphState) -> GraphState:
    state["graph_path"] = [*state.get("graph_path", []), "response_compose_node"]
    return state


def route_domain_node(state: GraphState) -> GraphState:
    route_map = {
        "about": "/about",
        "projects": "/projects",
        "work": "/about",
        "career_timeline": "/career-timeline",
        "passions": "/passions",
        "blog": "/blog",
        "contact": "/contact",
        "website": "/",
        "general": "/",
    }
    route = route_map.get(state["intent_name"], "/")
    actions: list[dict[str, object]] = [{"type": "navigate", "payload": {"to": route}}]
    text = state.get("text", "")
    if state.get("intent_name") == "contact" and _contains_contact_draft_request(text):
        draft = _extract_contact_draft(text)
        actions.append(
            {
                "type": "present",
                "payload": {
                    "component": "contact_message_draft",
                    "props": {
                        "subject": draft["subject"],
                        "body": draft["body"],
                    },
                },
            }
        )
    state["ui_actions"] = actions
    llm_reply = generate_kurama_reply(
        text,
        state["intent_name"],
        route,
        state.get("memory_summary", ""),
    )
    if state.get("intent_name") == "website":
        state["speech_text"] = llm_reply or "You are on Sai's website now. Ask me to open projects, blog, career timeline, or contact."
    elif state.get("intent_name") == "contact" and _contains_contact_draft_request(text):
        state["speech_text"] = (
            llm_reply
            or "I prepared your contact draft and opened contact. Please review and then click send."
        )
    else:
        state["speech_text"] = llm_reply or (
            f"Hey, I'm Kurama, Sai's personal assistant. Routing you to {route.replace('/', '') or 'home'}."
        )
    state["graph_path"] = [*state.get("graph_path", []), "route_domain_node"]
    return state


def evaluator_node(state: GraphState) -> GraphState:
    confidence = state.get("intent_confidence", 0.0)
    has_route = bool(state.get("ui_actions"))
    state["action_valid"] = confidence >= 0.55 and has_route and state.get("is_safe", True)
    state["graph_path"] = [*state.get("graph_path", []), "evaluator_node"]
    return state


def repair_or_finalize_node(state: GraphState) -> GraphState:
    state["graph_path"] = [*state.get("graph_path", []), "repair_or_finalize_node"]
    if state.get("action_valid", False):
        return state

    retries = state.get("retry_count", 0) + 1
    state["retry_count"] = retries
    if retries > state.get("max_retries", 1):
        state["speech_text"] = (
            "I need a little more detail before I route this. Could you rephrase your request?"
        )
        state["ui_actions"] = [{"type": "navigate", "payload": {"to": "/"}}]
        state["action_valid"] = True
        return state

    if state.get("intent_name") == "general":
        state["intent_name"] = "about"
        state["intent_confidence"] = 0.65
    return state


def hitl_gate_node(state: GraphState) -> GraphState:
    state["graph_path"] = [*state.get("graph_path", []), "hitl_gate_node"]
    if state.get("requires_human_approval", False):
        state["speech_text"] = "This action requires manual approval in demo mode. Routing to contact."
        state["ui_actions"] = [{"type": "navigate", "payload": {"to": "/contact"}}]
    return state


def emit_ui_and_voice_node(state: GraphState) -> GraphState:
    state["graph_path"] = [*state.get("graph_path", []), "emit_ui_and_voice_node"]
    return state
