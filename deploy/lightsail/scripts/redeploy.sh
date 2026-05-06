#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed on the server."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is not available on the server."
  exit 1
fi

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
STACK_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$STACK_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE"
  echo "Provide deploy/lightsail/.env before running redeploy."
  exit 1
fi

cd "$STACK_DIR"

docker compose --env-file "$ENV_FILE" up -d --build
docker compose --env-file "$ENV_FILE" ps
