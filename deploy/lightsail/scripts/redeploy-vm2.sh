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
ENV_FILE="$STACK_DIR/.env.vm2"
COMPOSE_FILE="$STACK_DIR/docker-compose.vm2.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE"
  echo "Copy .env.vm2.example to .env.vm2 and fill in the real values first."
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Missing $COMPOSE_FILE"
  exit 1
fi

cd "$STACK_DIR"

FORCE_REBUILD="${FORCE_REBUILD:-false}"

if [ "$FORCE_REBUILD" = "true" ]; then
  echo "Deploy mode: force rebuild"
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build
else
  echo "Deploy mode: no rebuild"
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
