import json
import os
from urllib import request
from urllib.error import HTTPError, URLError


def validate_utterance(text: str) -> dict[str, object]:
    cleaned = text.strip()
    if len(cleaned) < 3:
        print("[kurama-validate] rejected short utterance")
        return {"valid": False, "reason": "too_short", "cleaned_text": ""}

    api_key = os.getenv("AZURE_OPENAI_MAIN_API_KEY")
    base_url = os.getenv("AZURE_OPENAI_MAIN_BASE_URL", "").rstrip("/")
    deployment = os.getenv("AZURE_OPENAI_MAIN_BASE_MODEL")
    api_version = os.getenv("AZURE_OPENAI_MAIN_API_VERSION", "2024-12-01-preview")
    if not api_key or not base_url or not deployment:
        print("[kurama-validate] missing llm config, using heuristic")
        return {
            "valid": cleaned.lower() not in {"umm", "hmm", "mmm", "uh"},
            "reason": "heuristic",
            "cleaned_text": cleaned,
        }

    url = (
        f"{base_url}/openai/deployments/{deployment}/chat/completions"
        f"?api-version={api_version}"
    )
    body = {
        "messages": [
            {
                "role": "system",
                "content": (
                    "Classify whether user text is meaningful speech for an interactive assistant. "
                    "Reject filler/noise only text. Respond with JSON only: "
                    '{"valid": boolean, "reason": "string", "cleaned_text": "string"}'
                ),
            },
            {"role": "user", "content": cleaned},
        ],
        "temperature": 0,
        "max_completion_tokens": 90,
    }
    req = request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "api-key": api_key},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))
            content = payload["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            print(f"[kurama-validate] llm valid={parsed.get('valid')} reason={parsed.get('reason')}")
            return {
                "valid": bool(parsed.get("valid", False)),
                "reason": str(parsed.get("reason", "llm")),
                "cleaned_text": str(parsed.get("cleaned_text", cleaned)).strip(),
            }
    except (HTTPError, URLError, KeyError, IndexError, json.JSONDecodeError, TimeoutError) as error:
        print(f"[kurama-validate] fallback due to error={error}")
        return {
            "valid": cleaned.lower() not in {"umm", "hmm", "mmm", "uh"},
            "reason": "fallback",
            "cleaned_text": cleaned,
        }
