#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env.local" ]]; then
  set -a
  source ".env.local"
  set +a
fi

check_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "[base-check] missing env: ${name}"
    return 1
  fi
  echo "[base-check] env ok: ${name}"
}

curl_ok() {
  local label="$1"
  local url="$2"
  local expected="$3"
  local body
  body="$(curl -fsS "$url")"
  if [[ "$body" != *"$expected"* ]]; then
    echo "[base-check] ${label} unexpected response: ${body}"
    return 1
  fi
  echo "[base-check] ${label} ok"
}

check_var "AZURE_SPEECH_KEY"
check_var "AZURE_SPEECH_REGION"
check_var "ELEVENLABS_API_KEY"
check_var "ELEVENLABS_VOICE_ID"

curl_ok "web" "http://localhost:3000" "<!DOCTYPE html>"
curl_ok "gateway" "http://localhost:8080/healthz" "ok"
curl_ok "api" "http://localhost:8081/healthz" "ok"
curl_ok "orchestrator" "http://localhost:8000/healthz" "\"status\":\"ok\""

validate_payload='{"text":"show me projects"}'
orchestrate_payload='{"text":"show me projects"}'

validate_response="$(curl -fsS -X POST "http://localhost:8080/validate" -H "content-type: application/json" -d "$validate_payload")"
if [[ "$validate_response" != *"\"valid\""* ]]; then
  echo "[base-check] validate response invalid: $validate_response"
  exit 1
fi
echo "[base-check] validate proxy ok"

orchestrate_response="$(curl -fsS -X POST "http://localhost:8080/orchestrate" -H "content-type: application/json" -d "$orchestrate_payload")"
if [[ "$orchestrate_response" != *"\"speech_text\""* || "$orchestrate_response" != *"\"ui_actions\""* ]]; then
  echo "[base-check] orchestrate response invalid: $orchestrate_response"
  exit 1
fi
echo "[base-check] orchestrate proxy ok"

tts_status="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "http://localhost:3000/api/tts" -H "content-type: application/json" -d '{"text":"Kurama startup check."}')"
if [[ "$tts_status" != "200" ]]; then
  echo "[base-check] tts endpoint failed: http ${tts_status}"
  exit 1
fi
echo "[base-check] tts endpoint ok"

speech_status="$(curl -sS -o /dev/null -w "%{http_code}" "http://localhost:3000/api/speech/token")"
if [[ "$speech_status" != "200" ]]; then
  echo "[base-check] speech token endpoint failed: http ${speech_status}"
  exit 1
fi
echo "[base-check] speech token endpoint ok"

echo "[base-check] all checks passed"
