from app.graph.state import IntentName


def classify_intent(text: str) -> tuple[IntentName, float]:
    normalized = text.lower().strip()
    if "project" in normalized or "build" in normalized:
        return "projects", 0.89
    if "work" in normalized or "experience" in normalized:
        return "work", 0.85
    if "timeline" in normalized or "journey" in normalized:
        return "career_timeline", 0.86
    if "blog" in normalized or "article" in normalized:
        return "blog", 0.84
    if "passion" in normalized or "interest" in normalized:
        return "passions", 0.83
    if "contact" in normalized or "hire" in normalized:
        return "contact", 0.9
    if "about" in normalized or "who is" in normalized:
        return "about", 0.8
    return "general", 0.58
