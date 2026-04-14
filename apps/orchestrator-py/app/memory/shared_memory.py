from __future__ import annotations

import json
from pathlib import Path

MEMORY_FILE = Path(__file__).resolve().parent / "shared_memory.json"


def _read() -> list[dict[str, str]]:
    if not MEMORY_FILE.exists():
        return []
    try:
        return json.loads(MEMORY_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def append_turn(user_text: str, assistant_text: str) -> None:
    memory = _read()
    memory.append({"user": user_text, "assistant": assistant_text})
    MEMORY_FILE.write_text(json.dumps(memory[-80:], indent=2), encoding="utf-8")


def summarize_recent(max_turns: int = 8) -> str:
    memory = _read()[-max_turns:]
    if not memory:
        return "No prior shared conversations."
    lines = []
    for turn in memory:
        lines.append(f"User: {turn.get('user', '')}")
        lines.append(f"Kurama: {turn.get('assistant', '')}")
    return " | ".join(lines)
