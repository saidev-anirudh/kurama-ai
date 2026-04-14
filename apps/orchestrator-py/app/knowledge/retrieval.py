from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

from app.graph.state import IntentName

TOKEN_PATTERN = re.compile(r"[a-z0-9][a-z0-9_+-]{1,}")

INTENT_HINTS: dict[IntentName, tuple[str, ...]] = {
    "about": ("summary", "highlights", "skills", "profile"),
    "projects": ("projects", "github", "repository", "build", "langgraph"),
    "work": ("experience", "chat360", "nyx", "genpact", "voice ai lead"),
    "career_timeline": ("timeline", "experience", "career", "journey"),
    "passions": ("passion", "interests", "voice ai", "agentic systems"),
    "blog": ("blog", "article", "medium", "writing"),
    "contact": ("contact", "email", "linkedin", "reach", "message"),
    "website": ("website", "routes", "navigation", "pages"),
    "general": (),
}


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _knowledge_dir() -> Path:
    return _repo_root() / "data" / "knowledge"


@lru_cache(maxsize=1)
def _load_knowledge_files() -> dict[str, object]:
    knowledge_dir = _knowledge_dir()
    payload: dict[str, object] = {}
    for key in ("profile", "projects", "timeline", "blog-index", "passions"):
        path = knowledge_dir / f"{key}.json"
        if not path.exists():
            payload[key] = [] if key != "profile" else {}
            continue
        try:
            payload[key] = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            payload[key] = [] if key != "profile" else {}
    return payload


def _tokenize(text: str) -> set[str]:
    return {token.lower() for token in TOKEN_PATTERN.findall(text.lower())}


def _build_documents() -> list[tuple[str, str]]:
    data = _load_knowledge_files()
    docs: list[tuple[str, str]] = []

    profile = data.get("profile", {})
    if isinstance(profile, dict):
        docs.append(
            (
                "profile",
                " ".join(
                    str(profile.get(key, ""))
                    for key in ("name", "title", "location", "summary", "email", "phone", "linkedin", "github", "medium")
                ),
            )
        )
        for highlight in profile.get("highlights", []) if isinstance(profile.get("highlights"), list) else []:
            docs.append(("highlight", str(highlight)))
        for skill in profile.get("skills", []) if isinstance(profile.get("skills"), list) else []:
            docs.append(("skill", str(skill)))

    for project in data.get("projects", []) if isinstance(data.get("projects"), list) else []:
        if not isinstance(project, dict):
            continue
        docs.append(
            (
                "project",
                " ".join(str(project.get(field, "")) for field in ("name", "summary", "stack", "impact", "url")),
            )
        )

    for exp in data.get("timeline", []) if isinstance(data.get("timeline"), list) else []:
        if not isinstance(exp, dict):
            continue
        docs.append(
            (
                "timeline",
                " ".join(str(exp.get(field, "")) for field in ("company", "role", "period", "impact")),
            )
        )

    for post in data.get("blog-index", []) if isinstance(data.get("blog-index"), list) else []:
        if not isinstance(post, dict):
            continue
        docs.append(
            (
                "blog",
                " ".join(str(post.get(field, "")) for field in ("title", "description", "platform", "url")),
            )
        )

    for passion in data.get("passions", []) if isinstance(data.get("passions"), list) else []:
        if not isinstance(passion, dict):
            continue
        docs.append(("passion", " ".join(str(passion.get(field, "")) for field in ("name", "description"))))

    return docs


def retrieve_knowledge_context(query: str, intent_name: IntentName, max_items: int = 6) -> dict[str, object]:
    docs = _build_documents()
    query_tokens = _tokenize(query)
    hints = _tokenize(" ".join(INTENT_HINTS.get(intent_name, ())))

    scored: list[tuple[float, str]] = []
    for kind, text in docs:
        tokens = _tokenize(text)
        if not tokens:
            continue
        overlap = len(query_tokens & tokens)
        hint_overlap = len(hints & tokens)
        if overlap == 0 and hint_overlap == 0:
            continue
        score = overlap * 2.2 + hint_overlap * 1.1
        if kind in {"project", "timeline"}:
            score += 0.2
        scored.append((score, f"[{kind}] {text.strip()}"))

    scored.sort(key=lambda item: item[0], reverse=True)
    snippets = [text for _, text in scored[:max_items]]

    return {
        "knowledge_source": str(_knowledge_dir()),
        "matched_items": len(snippets),
        "snippets": snippets,
    }
