#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="${ROOT_DIR}/.runtime"
LOG_DIR="${RUNTIME_DIR}/logs"
mkdir -p "$LOG_DIR"

cd "$ROOT_DIR"

if [[ ! -f ".env.local" ]]; then
  echo "[dev-up] .env.local is missing. Copy .env.local.example first."
  exit 1
fi

set -a
source ".env.local"
set +a

ensure_python_venv() {
  if [[ ! -d "apps/orchestrator-py/.venv" ]]; then
    echo "[dev-up] creating orchestrator virtualenv"
    python3 -m venv "apps/orchestrator-py/.venv"
    (
      cd "apps/orchestrator-py"
      . .venv/bin/activate
      python -m pip install -e .
    )
  fi
}

is_port_open() {
  local port="$1"
  curl -fsS "http://localhost:${port}" >/dev/null 2>&1
}

stop_port_if_running() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:${port} -sTCP:LISTEN || true)"
  if [[ -n "$pids" ]]; then
    echo "[dev-up] stopping existing process on :${port}"
    for pid in $pids; do
      kill "$pid" >/dev/null 2>&1 || true
    done
    sleep 1
  fi
}

start_service() {
  local name="$1"
  local port="$2"
  local cmd="$3"
  local log_file="${LOG_DIR}/${name}.log"
  local pid_file="${RUNTIME_DIR}/${name}.pid"

  stop_port_if_running "$port"
  echo "[dev-up] starting ${name}"
  nohup bash -lc "$cmd" >"$log_file" 2>&1 &
  echo "$!" >"$pid_file"
}

ensure_python_venv

start_service "web" "3000" "cd \"$ROOT_DIR\" && pnpm --filter @portfolio/web dev"
start_service "gateway" "8080" "cd \"$ROOT_DIR/apps/gateway-go\" && go run ./cmd/server"
start_service "api" "8081" "cd \"$ROOT_DIR/apps/api-go\" && go run ./cmd/api"
start_service "orchestrator" "8000" "cd \"$ROOT_DIR/apps/orchestrator-py\" && . .venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo "[dev-up] waiting for services to warm up"
sleep 4

"$ROOT_DIR/scripts/base-check.sh"

echo "[dev-up] startup and base checks complete"
