# Lightsail MVP Deploy (Cheapest Single-VM Setup)

This stack runs everything on one Lightsail instance:

- `web` (frontend static + reverse proxy)
- `csharp-api` (`backend/fookbase.API`)
- `java-api` (`chat_app/backend`)
- `postgres` (for C#)
- `mysql` + `redis` (for Java)
- `rabbitmq` (read-model events)

## 1) Create Lightsail instance

- Recommended for this stack: Linux plan `2 GB RAM / $12`.
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
