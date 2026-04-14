from typing import Literal, TypedDict


IntentName = Literal[
    "about",
    "projects",
    "work",
    "career_timeline",
    "passions",
    "blog",
    "contact",
    "website",
    "general",
]


class GraphState(TypedDict, total=False):
    text: str
    session_id: str
    intent_name: IntentName
    intent_confidence: float
    speech_text: str
    ui_actions: list[dict[str, object]]
    graph_path: list[str]
    graph_trace_id: str
    retrieval_context: dict[str, object]
    knowledge_context: list[str]
    personalization_context: dict[str, object]
    website_context: dict[str, object]
    action_valid: bool
    is_safe: bool
    requires_human_approval: bool
    retry_count: int
    max_retries: int
    memory_summary: str
