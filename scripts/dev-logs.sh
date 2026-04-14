#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${ROOT_DIR}/.runtime/logs"

if [[ ! -d "$LOG_DIR" ]]; then
  echo "[dev-logs] log directory not found: $LOG_DIR"
  exit 1
fi

echo "[dev-logs] streaming service logs from $LOG_DIR"
exec tail -n 150 -f \
  "$LOG_DIR/web.log" \
  "$LOG_DIR/gateway.log" \
  "$LOG_DIR/api.log" \
  "$LOG_DIR/orchestrator.log"
