#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Perfume Intelligence Lab — Deployment Script
#
# Usage:
#   First deploy:   bash deploy.sh --setup
#   Update deploy:  bash deploy.sh
#
# Before running --setup, upload your code to APP_DIR manually:
#   scp -r ./frontend user@server:/opt/pil/frontend
#   (or git clone on the server yourself)
#
# Requirements on the server:
#   - Node.js ≥ 20   (https://nodejs.org)
#   - PM2             (npm install -g pm2)
#   - build-essential & python3  (for better-sqlite3 native module)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config (edit these) ───────────────────────────────────────────────────────
APP_DIR="/opt/pil/frontend"           # absolute path where the app lives
APP_NAME="pil-frontend"               # PM2 process name
APP_PORT=3000                         # Next.js port
APP_USER="pil"                        # Linux user that runs the app
LOG_DIR="/var/log/pil"
BACKUP_DIR="/opt/pil/backups"
# ─────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

SETUP=false
[[ "${1:-}" == "--setup" ]] && SETUP=true

# ── Guard: must not run as root for the app itself ────────────────────────────
if [[ $EUID -eq 0 && "$SETUP" == false ]]; then
  warn "Running as root — consider using a dedicated 'pil' user for production."
fi

# ═══════════════════════════════════════════════════════════════════════════════
# SETUP MODE  (run once on a fresh server)
# ═══════════════════════════════════════════════════════════════════════════════
if [[ "$SETUP" == true ]]; then
  info "=== FIRST-TIME SETUP ==="

  # ── Guard: app code must be present — auto-copy if running from the repo ──
  if [[ ! -f "$APP_DIR/package.json" ]]; then
    if [[ -f "./frontend/package.json" ]]; then
      info "Found frontend/ in current directory — copying to $APP_DIR..."
      sudo mkdir -p "$APP_DIR"
      sudo cp -r ./frontend/. "$APP_DIR/"
      success "Code copied to $APP_DIR"
    else
      error "App code not found. Run this script from inside the extracted repo folder (the one that contains the frontend/ directory)."
    fi
  else
    success "App code found at $APP_DIR"
  fi

  # ── System packages ──────────────────────────────────────────────────────────
  info "Installing system dependencies..."
  sudo apt-get update -qq
  sudo apt-get install -y curl build-essential python3 nginx ufw

  # ── Node.js 20 ───────────────────────────────────────────────────────────────
  if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt 20 ]]; then
    info "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  else
    success "Node.js $(node -v) already installed"
  fi

  # ── PM2 ─────────────────────────────────────────────────────────────────────
  if ! command -v pm2 &>/dev/null; then
    info "Installing PM2..."
    sudo npm install -g pm2
  else
    success "PM2 $(pm2 -v) already installed"
  fi

  # ── App user ─────────────────────────────────────────────────────────────────
  if ! id "$APP_USER" &>/dev/null; then
    info "Creating system user '$APP_USER'..."
    sudo useradd -r -m -s /bin/bash "$APP_USER"
  else
    success "User '$APP_USER' already exists"
  fi

  # ── Directories ───────────────────────────────────────────────────────────────
  info "Creating directories..."
  sudo mkdir -p "$(dirname "$APP_DIR")" "$LOG_DIR" "$BACKUP_DIR"
  sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR" "$(dirname "$APP_DIR")" "$LOG_DIR" "$BACKUP_DIR"

  # ── .env.local ───────────────────────────────────────────────────────────────
  if [[ ! -f "$APP_DIR/.env.local" ]]; then
    info "Creating .env.local from example..."
    sudo -u "$APP_USER" cp "$APP_DIR/.env.example" "$APP_DIR/.env.local"
    success "Created $APP_DIR/.env.local — edit it if needed"
  fi

  # ── npm install + prisma + build ─────────────────────────────────────────────
  info "Installing npm dependencies (this may take a few minutes)..."
  sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm install"

  info "Generating Prisma client..."
  sudo -u "$APP_USER" bash -c "cd $APP_DIR && npx prisma generate"

  info "Running database migrations..."
  sudo -u "$APP_USER" bash -c "cd $APP_DIR && npx prisma migrate deploy"

  info "Seeding initial data..."
  sudo -u "$APP_USER" bash -c "cd $APP_DIR && npx tsx prisma/seed.ts" || warn "Seed failed or already seeded — continuing"

  info "Building Next.js..."
  sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm run build"

  # ── DB permissions ────────────────────────────────────────────────────────────
  sudo chown "$APP_USER:$APP_USER" "$APP_DIR/prisma/pil.db" 2>/dev/null || true
  sudo chmod 664 "$APP_DIR/prisma/pil.db" 2>/dev/null || true
  sudo chmod 775 "$APP_DIR/prisma/"

  # ── PM2 ecosystem config ──────────────────────────────────────────────────────
  info "Writing PM2 ecosystem config..."
  sudo -u "$APP_USER" tee "$APP_DIR/ecosystem.config.js" > /dev/null << EOFPM2
module.exports = {
  apps: [{
    name: "$APP_NAME",
    script: "node_modules/.bin/next",
    args: "start",
    cwd: "$APP_DIR",
    user: "$APP_USER",
    instances: 1,
    exec_mode: "fork",
    env: { NODE_ENV: "production", PORT: $APP_PORT },
    max_restarts: 10,
    min_uptime: "5s",
    out_file: "$LOG_DIR/app.log",
    error_file: "$LOG_DIR/error.log",
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss"
  }]
};
EOFPM2

  # ── Start app with PM2 ────────────────────────────────────────────────────────
  info "Starting app with PM2..."
  sudo -u "$APP_USER" bash -c "cd $APP_DIR && pm2 start ecosystem.config.js"
  sudo -u "$APP_USER" pm2 save
  sudo pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" | tail -1 | sudo bash || true

  # ── Nginx config ─────────────────────────────────────────────────────────────
  info "Configuring Nginx..."
  sudo tee /etc/nginx/sites-available/pil > /dev/null << 'EOFNGINX'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    location /_next/static/ {
        proxy_pass       http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires          1y;
        add_header       Cache-Control "public, immutable";
    }
}
EOFNGINX

  sudo ln -sf /etc/nginx/sites-available/pil /etc/nginx/sites-enabled/pil
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t && sudo systemctl reload nginx

  # ── Firewall ─────────────────────────────────────────────────────────────────
  info "Configuring UFW firewall..."
  sudo ufw allow OpenSSH
  sudo ufw allow 'Nginx Full'
  sudo ufw --force enable

  # ── Backup cron ──────────────────────────────────────────────────────────────
  info "Installing nightly DB backup cron..."
  (sudo crontab -u "$APP_USER" -l 2>/dev/null || true; echo "0 2 * * * cp $APP_DIR/prisma/pil.db $BACKUP_DIR/pil_\$(date +\\%Y\\%m\\%d).db && find $BACKUP_DIR -name '*.db' -mtime +30 -delete") \
    | sudo crontab -u "$APP_USER" -

  echo ""
  success "═══════════════════════════════════════════════"
  success " Setup complete!"
  success " App running at: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
  success " Login: admin@pil.com / admin123"
  success "═══════════════════════════════════════════════"
  echo ""
  warn "Next steps:"
  echo "  1. Point your domain DNS A record to this server's IP"
  echo "  2. Run: sudo certbot --nginx -d yourdomain.com"
  echo "  3. Update /etc/nginx/sites-available/pil with your domain"
  exit 0
fi

# ═══════════════════════════════════════════════════════════════════════════════
# UPDATE MODE  (regular deploys — run after uploading new code)
# ═══════════════════════════════════════════════════════════════════════════════
info "=== DEPLOYING UPDATE ==="
cd "$APP_DIR"

# ── Backup DB before update ───────────────────────────────────────────────────
if [[ -f "$APP_DIR/prisma/pil.db" ]]; then
  BACKUP_FILE="$BACKUP_DIR/pil_pre_deploy_$(date +%Y%m%d_%H%M%S).db"
  info "Backing up database → $BACKUP_FILE"
  cp "$APP_DIR/prisma/pil.db" "$BACKUP_FILE"
  success "Database backed up"
fi

# ── Install new/updated packages ──────────────────────────────────────────────
info "Installing dependencies..."
npm install --production=false
success "Dependencies installed"

# ── Prisma ────────────────────────────────────────────────────────────────────
info "Regenerating Prisma client..."
npx prisma generate

info "Applying database migrations..."
npx prisma migrate deploy
success "Migrations applied"

# ── Build ─────────────────────────────────────────────────────────────────────
info "Building Next.js..."
npm run build
success "Build complete"

# ── Reload app (zero downtime) ────────────────────────────────────────────────
info "Reloading PM2 process..."
pm2 reload "$APP_NAME" --update-env
success "App reloaded"

# ── Health check ─────────────────────────────────────────────────────────────
info "Health check..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:"$APP_PORT"/api/stats)
if [[ "$HTTP_STATUS" == "200" ]]; then
  success "Health check passed (HTTP $HTTP_STATUS)"
else
  error "Health check FAILED (HTTP $HTTP_STATUS) — check: pm2 logs $APP_NAME"
fi

echo ""
success "═══════════════════════════════════════════════"
success " Deploy complete! $(date '+%Y-%m-%d %H:%M:%S')"
success "═══════════════════════════════════════════════"
