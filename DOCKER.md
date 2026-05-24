# 🐳 Docker + MySQL Deployment Guide

Complete step-by-step guide to deploy **Perfume Intelligence Lab** using Docker Compose with MySQL 8.0.

---

## Architecture

```
Internet
    │
    ▼
┌─────────┐   :80 / :443
│  Nginx  │ ◄─────────────── Reverse proxy, gzip, static cache
└────┬────┘
     │ http://app:3000
     ▼
┌─────────┐   :3000
│   App   │ ◄─────────────── Next.js (Node.js), Prisma ORM
└────┬────┘
     │ mysql://db:3306
     ▼
┌─────────┐   :3306 (internal only)
│  MySQL  │ ◄─────────────── MySQL 8.0, persisted volume
└─────────┘
```

All three services run in the same Docker network (`pil_default`). MySQL is **not** exposed publicly by default.

---

## Prerequisites

Make sure these are installed on your server:

| Tool | Min Version | Check |
|---|---|---|
| Docker | 24+ | `docker --version` |
| Docker Compose | 2.20+ | `docker compose version` |
| Git | any | `git --version` |

### Install Docker (Ubuntu/Debian)

```bash
# Remove old versions
sudo apt-get remove -y docker docker-engine docker.io containerd runc

# Install Docker Engine
curl -fsSL https://get.docker.com | sudo bash

# Add your user to the docker group (log out and back in after)
sudo usermod -aG docker $USER

# Verify
docker --version
docker compose version
```

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/harshallakare/perfume-intelligence-lab.git
cd perfume-intelligence-lab
```

---

## Step 2 — Configure Environment Variables

```bash
cp .env.docker.example .env.docker
nano .env.docker        # or use your preferred editor
```

Fill in the values:

```env
MYSQL_ROOT_PASSWORD=use_a_strong_password_here
MYSQL_DATABASE=pil
MYSQL_USER=pil
MYSQL_PASSWORD=another_strong_password_here
```

**Security tips:**
- Use passwords of at least 20 characters
- Never commit `.env.docker` to git (it's already in `.gitignore`)
- For production, consider a secrets manager (Vault, AWS Secrets Manager)

---

## Step 3 — Build the Docker Image

This step compiles the Next.js app and generates the Prisma MySQL client.  
It takes **3–5 minutes** on the first run (downloading base images + npm install).

```bash
docker compose --env-file .env.docker build
```

To see build progress in detail:
```bash
docker compose --env-file .env.docker build --progress=plain
```

---

## Step 4 — Start All Services

```bash
docker compose --env-file .env.docker up -d
```

This starts three containers:
- `pil-db` — MySQL 8.0
- `pil-app` — Next.js app (waits for MySQL to be healthy before starting)
- `pil-nginx` — Nginx reverse proxy

On first boot, the app automatically:
1. Waits for MySQL to accept connections
2. Runs Prisma migrations (creates all tables)
3. Seeds the initial data (org, demo users, sample materials)
4. Starts the Next.js server

---

## Step 5 — Verify Everything Is Running

```bash
# Check container status
docker compose --env-file .env.docker ps

# Expected output:
# NAME        IMAGE     STATUS              PORTS
# pil-db      mysql:8.0 Up (healthy)        3306/tcp
# pil-app     pil-app   Up (healthy)        3000/tcp
# pil-nginx   nginx     Up                  0.0.0.0:80->80/tcp
```

**Health check:**
```bash
curl -s http://localhost/api/stats | python3 -m json.tool
```

**View startup logs:**
```bash
docker logs pil-app --follow
```

---

## Step 6 — Access the App

Open your browser at:

```
http://YOUR_SERVER_IP
```

**Default login credentials:**

| Email | Password | Role |
|---|---|---|
| admin@pil.com | admin123 | Admin |
| perfumer@pil.com | perfumer123 | Perfumer |
| viewer@pil.com | viewer123 | Viewer |

> ⚠️ Change these credentials after first login in Settings → Team.

---

## Step 7 — Configure SSL (HTTPS)

### Option A: Certbot + Let's Encrypt (recommended for domains)

```bash
# Install Certbot
sudo apt install -y certbot

# Stop nginx temporarily
docker compose --env-file .env.docker stop nginx

# Issue certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certs are saved to:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

Update `docker/nginx.conf` to add HTTPS:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # ... rest of the existing location blocks ...
}
```

Mount the certs into the nginx container by adding to `docker-compose.yml` under the `nginx` service:

```yaml
volumes:
  - ./docker/nginx.conf:/etc/nginx/conf.d/default.conf:ro
  - /etc/letsencrypt/live/yourdomain.com/fullchain.pem:/etc/nginx/certs/fullchain.pem:ro
  - /etc/letsencrypt/live/yourdomain.com/privkey.pem:/etc/nginx/certs/privkey.pem:ro
```

```bash
docker compose --env-file .env.docker up -d nginx
```

**Auto-renew certs (cron):**
```bash
# Add to root crontab
sudo crontab -e
# Add this line:
0 3 * * * certbot renew --quiet && docker compose -f /path/to/perfume-intelligence-lab/docker-compose.yml --env-file /path/to/.env.docker restart nginx
```

### Option B: Cloudflare (easiest)

Point your domain to this server's IP in Cloudflare DNS with the proxy enabled (orange cloud). Cloudflare handles SSL for you automatically — no cert setup needed on the server.

---

## Updating the App

After pushing new code to GitHub:

```bash
cd perfume-intelligence-lab

# Pull latest code
git pull origin main

# Rebuild the app image (only app, not db/nginx)
docker compose --env-file .env.docker build app

# Restart app with zero downtime (old container stays up until new one is healthy)
docker compose --env-file .env.docker up -d --no-deps app

# Check it's running
docker logs pil-app --tail=50
```

New database migrations are applied automatically on startup via the entrypoint script.

---

## Common Operations

### View logs

```bash
# App logs (real-time)
docker logs pil-app --follow

# MySQL logs
docker logs pil-db --follow

# Nginx access logs
docker logs pil-nginx --follow
```

### Connect to MySQL

```bash
# From inside the MySQL container
docker exec -it pil-db mysql -u pil -p pil

# From your host machine (if MYSQL_EXTERNAL_PORT is set in .env.docker)
mysql -h 127.0.0.1 -P 3306 -u pil -p pil
```

### Run a manual migration

```bash
docker exec -it pil-app npx prisma migrate deploy
```

### Re-seed the database

```bash
docker exec -it pil-app npx tsx prisma/seed.ts
```

### Open Prisma Studio (DB GUI)

Prisma Studio can't run inside Docker easily, but you can connect it from your local machine if `MYSQL_EXTERNAL_PORT` is exposed:

```bash
# On your LOCAL machine (not server)
DATABASE_URL="mysql://pil:password@SERVER_IP:3306/pil" npx prisma studio
```

### Restart a single service

```bash
docker compose --env-file .env.docker restart app
docker compose --env-file .env.docker restart nginx
docker compose --env-file .env.docker restart db
```

### Stop everything

```bash
docker compose --env-file .env.docker down
```

### Stop and delete all data (⚠️ destructive)

```bash
docker compose --env-file .env.docker down -v
```

---

## Database Backups

### Manual backup

```bash
# Dump MySQL database to a file
docker exec pil-db mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" pil > backup_$(date +%Y%m%d_%H%M%S).sql

# Or set the password inline from .env.docker
MYSQL_ROOT_PASSWORD=$(grep MYSQL_ROOT_PASSWORD .env.docker | cut -d= -f2)
docker exec pil-db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" pil > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from backup

```bash
docker exec -i pil-db mysql -u root -p"$MYSQL_ROOT_PASSWORD" pil < backup_20240101_120000.sql
```

### Automated nightly backup (cron)

```bash
sudo crontab -e
# Add:
0 2 * * * cd /opt/pil && MYSQL_ROOT_PASSWORD=$(grep MYSQL_ROOT_PASSWORD .env.docker | cut -d= -f2) && docker exec pil-db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" pil > /opt/pil/backups/pil_$(date +\%Y\%m\%d).sql && find /opt/pil/backups -name "*.sql" -mtime +30 -delete
```

This keeps 30 days of daily backups.

---

## Troubleshooting

### App won't start — "MySQL not ready"

MySQL takes 20–30 seconds on first boot to initialise. The entrypoint retries for 90 seconds. Check:

```bash
docker logs pil-db
docker logs pil-app
```

If MySQL shows `ready for connections` but the app still fails, check your `MYSQL_PASSWORD` in `.env.docker` matches on both the `db` and `app` sides.

### Port 80 already in use

```bash
sudo lsof -i :80          # see what's using port 80
sudo systemctl stop nginx # if it's a system nginx
```

Or change the Nginx port in `docker-compose.yml`:
```yaml
ports:
  - "8080:80"   # access on :8080 instead
```

### Prisma migration errors

```bash
# View migration status
docker exec -it pil-app npx prisma migrate status

# If migrations are out of sync, reset (⚠️ deletes all data)
docker exec -it pil-app npx prisma migrate reset --force
```

### Image build fails — native module error

This usually means `python3`, `make`, or `g++` are missing from the build stage. The Dockerfile already includes them. If you see this locally, ensure Docker has enough memory (≥4GB RAM assigned).

### Check disk space

```bash
docker system df           # show Docker disk usage
docker system prune -f     # clean unused images/containers/networks
```

---

## Resource Requirements

| Component | Minimum | Recommended |
|---|---|---|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disk | 10 GB | 20 GB |
| OS | Ubuntu 22.04 / Debian 12 | Ubuntu 22.04 LTS |

---

## File Reference

```
perfume-intelligence-lab/
├── Dockerfile                    # Multi-stage build (deps → builder → runner)
├── docker-compose.yml            # MySQL + App + Nginx services
├── .env.docker.example           # Environment template → copy to .env.docker
├── .dockerignore                 # Files excluded from Docker build context
└── docker/
    ├── schema.mysql.prisma       # MySQL-compatible Prisma schema
    ├── db.mysql.ts               # PrismaClient without SQLite adapter
    ├── prisma.config.ts          # Prisma config reading DATABASE_URL
    ├── entrypoint.sh             # Startup: wait → migrate → seed → start
    ├── nginx.conf                # Nginx reverse proxy config
    └── mysql-init/               # Optional: .sql files auto-run on DB init
```

> **Local development** continues to use SQLite as before (`npm run dev`). The Docker files only override the database layer at build time — no local files are changed.
