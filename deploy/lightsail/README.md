# Lightsail MVP Deploy (Cheapest Single-VM Setup)

This stack runs everything on one Lightsail instance:

- `web` (frontend static + reverse proxy)
- `csharp-api` (`backend/fookbase.API`)
- `java-api` (`chat_app/backend`)
- `postgres` (for C#)
- `mysql` + `redis` (for Java)
- `rabbitmq` (read-model events)

## 1) Create Lightsail instance

- Recommended starting point for this stack: Linux/Ubuntu plan with at least `2 GB RAM`.
- Check current Lightsail pricing before choosing a plan because AWS pricing changes over time.
- Open firewall ports: `22`, `80` (and `443` later if you add TLS).

## 2) Install Docker on server (Ubuntu)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
newgrp docker
```

## 3) Clone repo and prepare `.env`

```bash
git clone <your-repo-url> fookbase
cd fookbase/deploy/lightsail
cp .env.example .env
```

Edit `.env`:

- Set `APP_ORIGIN` to your public endpoint.
  - No domain yet: `http://<LIGHTSAIL_PUBLIC_IP>`
  - With domain: `https://<your-domain>`
- Set `VITE_API_BASE_URL` and `VITE_JAVA_API_BASE_URL` to the same value as `APP_ORIGIN`.
- Keep `C_SHARP_ENABLE_HTTPS_REDIRECTION=false` for the included HTTP-only Lightsail setup.
  - If you later add real HTTPS in front of the app and preserve `X-Forwarded-Proto`, switch it to `true`.
- Set strong secrets for:
  - `C_SHARP_JWT_SECRET_KEY`
  - `JAVA_JWT_SIGNER_KEY`
  - `JAVA_RESET_TOKEN_SECRET`
  - DB/RabbitMQ passwords

## 4) Start stack

```bash
docker compose --env-file .env up -d --build
```

Quick way (auto-generate `.env`, detect public IP, generate secrets, deploy):

```bash
chmod +x scripts/quick-deploy-http.sh
./scripts/quick-deploy-http.sh
```

Check status/logs:

```bash
docker compose ps
docker compose logs -f web
docker compose logs -f csharp-api
docker compose logs -f java-api
```

## 5) Route map

- `/api/messenger/*`, `/api/users/online`, `/api/profiles/me/complete-profile`, `/ws*` -> Java
- `/api/*`, `/hubs/*`, `/swagger` -> C#
- `/` -> Frontend SPA

## 6) PostgreSQL backup

```bash
chmod +x scripts/backup-postgres.sh
./scripts/backup-postgres.sh
```

Optional daily cron at 03:00:

```bash
crontab -e
```

```cron
0 3 * * * cd /home/ubuntu/fookbase/deploy/lightsail && ./scripts/backup-postgres.sh >> /home/ubuntu/fookbase/deploy/lightsail/backups/backup.log 2>&1
```

## 7) Update deploy

```bash
cd /home/ubuntu/fookbase
git pull
cd deploy/lightsail
docker compose --env-file .env up -d --build
```

## 8) GitHub Actions auto-deploy from `deploy` branch

This repo also supports a separate GitHub Actions workflow for Lightsail:

- Workflow file: `.github/workflows/lightsail-deploy.yml`
- Trigger: push to branch `deploy`
- It does not run on `main`

What it does:

- Build frontend
- Build and test C# backend
- Build and test Java backend
- Sync the repo to your Lightsail server over SSH
- Upload `deploy/lightsail/.env` from GitHub Secrets
- Run `deploy/lightsail/scripts/redeploy.sh`

Required GitHub Secrets:

- `LIGHTSAIL_HOST`: public IP or hostname of the Lightsail server
- `LIGHTSAIL_USERNAME`: SSH user, usually `ubuntu`
- `LIGHTSAIL_SSH_KEY`: private SSH key used by GitHub Actions to connect to the server
- `LIGHTSAIL_APP_DIR`: absolute directory on the server, for example `/home/ubuntu/fookbase`
- `LIGHTSAIL_ENV_FILE`: full content of `deploy/lightsail/.env`

Server prerequisites:

- Docker and Docker Compose v2 are installed
- Ports `80` and `443` are open as needed
- The parent directory of `LIGHTSAIL_APP_DIR` exists

After this is configured, pushing to `deploy` is enough to deploy the latest code to Lightsail.

## 9) API-only deploy for small Lightsail instances

If you want to keep Lightsail light, use the API-only stack:

- `api-gateway` (nginx reverse proxy only)
- `csharp-api`
- `java-api`
- no local `postgres`, `mysql`, `redis`, or `rabbitmq`
- frontend should be deployed separately, for example on Cloudflare Pages

Files:

- `docker-compose.api-only.yml`
- `nginx.api-only.conf`
- `.env.api-only.example`
- `scripts/redeploy-api-only.sh`

Quick start:

```bash
cp .env.api-only.example .env
chmod +x scripts/redeploy-api-only.sh
./scripts/redeploy-api-only.sh
```

Recommended external services for demos or hobby workloads:

- C# PostgreSQL: Neon
- Java MySQL-compatible database: TiDB Cloud Starter
- Redis: Upstash
- RabbitMQ: CloudAMQP

Important note about RabbitMQ:

- The current C# read-model consumer only supports basic RabbitMQ host, port, user, password settings.
- If your managed RabbitMQ provider requires TLS-only connections, keep `READ_MODEL_CONSUMER_ENABLED=false` until TLS support is added to the C# consumer.
- You can also keep `READ_MODEL_EVENTS_ENABLED=false` on the Java side for a simpler first deployment.
