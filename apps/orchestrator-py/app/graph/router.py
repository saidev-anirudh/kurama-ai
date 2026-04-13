def route_intent(text: str) -> dict[str, object]:
    normalized = text.lower().strip()
    if "project" in normalized:
        name = "projects"
    elif "work" in normalized or "experience" in normalized:
        name = "work"
    elif "contact" in normalized:
        name = "contact"
    else:
        name = "general"
    return {"name": name, "confidence": 0.5}
