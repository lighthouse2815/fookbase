#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin is not available."
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "OpenSSL is required (install with: sudo apt install -y openssl)."
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required (install with: sudo apt install -y curl)."
  exit 1
fi

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
STACK_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$STACK_DIR/.env"
ENV_EXAMPLE_FILE="$STACK_DIR/.env.example"

if [ ! -f "$ENV_EXAMPLE_FILE" ]; then
  echo "Missing $ENV_EXAMPLE_FILE"
  exit 1
fi

cd "$STACK_DIR"

if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d-%H%M%S)"
fi

cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"

PUBLIC_IP="${PUBLIC_IP:-$(curl -fsS ifconfig.me)}"
APP_ORIGIN="http://${PUBLIC_IP}"

replace_line() {
  local key="$1"
  local value="$2"
  sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
}

replace_line "APP_ORIGIN" "$APP_ORIGIN"
replace_line "VITE_API_BASE_URL" "$APP_ORIGIN"
replace_line "VITE_JAVA_API_BASE_URL" "$APP_ORIGIN"

replace_line "POSTGRES_PASSWORD" "$(openssl rand -hex 16)"
replace_line "MYSQL_ROOT_PASSWORD" "$(openssl rand -hex 16)"
replace_line "MYSQL_PASSWORD" "$(openssl rand -hex 16)"
replace_line "RABBITMQ_DEFAULT_PASS" "$(openssl rand -hex 16)"
replace_line "C_SHARP_JWT_SECRET_KEY" "$(openssl rand -hex 32)"
replace_line "JAVA_JWT_SIGNER_KEY" "$(openssl rand -hex 32)"
replace_line "JAVA_RESET_TOKEN_SECRET" "$(openssl rand -hex 32)"

echo "Starting deployment with APP_ORIGIN=${APP_ORIGIN}"
docker compose --env-file "$ENV_FILE" up -d --build

echo
echo "Deployment done."
echo "Open:"
echo "  ${APP_ORIGIN}/"
echo "  ${APP_ORIGIN}/swagger"
echo
echo "Check status:"
echo "  docker compose --env-file .env ps"
echo "Check logs:"
echo "  docker compose --env-file .env logs -f web csharp-api java-api"
