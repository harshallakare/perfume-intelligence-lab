#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Perfume Intelligence Lab — Update Script
#
# Pulls the latest code from GitHub, syncs it to the running app directory,
# rebuilds, and hot-reloads PM2. Safe to run on a live server — existing data
# (.env.local, pil.db) is never touched.
#
# Usage:
#   bash update.sh
#
# Run this from anywhere on the server as the app user (pil) or root.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config (must match deploy.sh) ────────────────────────────────────────────
REPO_URL="https://github.com/harshallakare/perfume-intelligence-lab"
REPO_DIR="/opt/pil/repo"       # staging area — git clone lives here
APP_DIR="/opt/pil/frontend"    # live app — where PM2 actually runs from
APP_NAME="pil-frontend"        # PM2 process name
APP_PORT=3000
APP_USER="pil"
BACKUP_DIR="/opt/pil/backups"
# ─────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Helper: run as APP_USER when we are root ──────────────────────────────────
run_as_app() {
  if [[ $EUID -eq 0 ]]; then
    sudo -u "$APP_USER" bash -c "cd $APP_DIR && $*"
  else
    bash -c "cd $APP_DIR && $*"
  fi
}

echo ""
info "════════════════════════════════════════════════"
info "  Perfume Intelligence Lab — Update"
info "  $(date '+%Y-%m-%d %H:%M:%S')"
info "════════════════════════════════════════════════"
echo ""

# ── 1. Guard: APP_DIR must exist (deploy.sh --setup must have run first) ─────
[[ -d "$APP_DIR" && -f "$APP_DIR/package.json" ]] \
  || error "App not found at $APP_DIR. Run 'bash deploy.sh --setup' first."

# ── 2. Ensure rsync is available ─────────────────────────────────────────────
if ! command -v rsync &>/dev/null; then
  info "Installing rsync..."
  sudo apt-get install -y rsync -qq
fi

# ── 3. Backup database before any changes ───────────────────────────────────
if [[ -f "$APP_DIR/prisma/pil.db" ]]; then
  sudo mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/pil_pre_update_$(date +%Y%m%d_%H%M%S).db"
  info "Backing up database → $BACKUP_FILE"
  sudo cp "$APP_DIR/prisma/pil.db" "$BACKUP_FILE"
  success "Database backed up"
fi

# ── 4. Pull latest code from GitHub ──────────────────────────────────────────
if [[ -d "$REPO_DIR/.git" ]]; then
  info "Pulling latest code from GitHub..."
  sudo git -C "$REPO_DIR" fetch origin main
  sudo git -C "$REPO_DIR" reset --hard origin/main
  COMMIT=$(git -C "$REPO_DIR" log -1 --pretty=format:'%h — %s (%ar)')
  success "Repo up to date: $COMMIT"
else
  info "Cloning repository to $REPO_DIR (first time)..."
  sudo mkdir -p "$(dirname "$REPO_DIR")"
  sudo git clone "$REPO_URL" "$REPO_DIR"
  sudo chown -R "$APP_USER:$APP_USER" "$REPO_DIR"
  success "Repository cloned"
fi

# ── 5. Sync frontend/ → APP_DIR  (never overwrites data or config) ───────────
info "Syncing updated files to $APP_DIR..."
sudo rsync -a --delete \
  --exclude='.env.local' \
  --exclude='prisma/pil.db' \
  --exclude='prisma/pil.db-shm' \
  --exclude='prisma/pil.db-wal' \
  --exclude='prisma/*.bak' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  "$REPO_DIR/frontend/" "$APP_DIR/"
sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
success "Files synced"

# ── 6. Install / update npm packages ─────────────────────────────────────────
info "Installing dependencies..."
run_as_app "npm install --production=false"
success "Dependencies installed"

# ── 7. Prisma: regenerate client + run any new migrations ────────────────────
info "Regenerating Prisma client..."
run_as_app "npx prisma generate"

info "Applying database migrations..."
run_as_app "npx prisma migrate deploy"
success "Migrations applied"

# ── 8. Build Next.js ──────────────────────────────────────────────────────────
info "Building Next.js..."
run_as_app "npm run build"
success "Build complete"

# ── 9. Hot-reload PM2 (zero downtime) ────────────────────────────────────────
info "Reloading PM2 process..."
if [[ $EUID -eq 0 ]]; then
  sudo -u "$APP_USER" pm2 reload "$APP_NAME" --update-env \
    || sudo -u "$APP_USER" pm2 start "$APP_DIR/ecosystem.config.js"
else
  pm2 reload "$APP_NAME" --update-env \
    || pm2 start "$APP_DIR/ecosystem.config.js"
fi
success "App reloaded"

# ── 10. Health check ──────────────────────────────────────────────────────────
info "Health check..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:"$APP_PORT"/api/stats || echo "000")
if [[ "$HTTP_STATUS" == "200" ]]; then
  success "Health check passed (HTTP $HTTP_STATUS)"
else
  warn "Health check returned HTTP $HTTP_STATUS — check logs: pm2 logs $APP_NAME"
fi

# ── 11. Tidy old backups (keep last 14) ──────────────────────────────────────
if [[ -d "$BACKUP_DIR" ]]; then
  find "$BACKUP_DIR" -name 'pil_pre_update_*.db' -printf '%T@ %p\n' \
    | sort -n | head -n -14 | awk '{print $2}' | xargs -r rm --
fi

echo ""
success "════════════════════════════════════════════════"
success " Update complete! $(date '+%Y-%m-%d %H:%M:%S')"
success " Commit: $( git -C "$REPO_DIR" log -1 --pretty=format:'%h — %s' 2>/dev/null || echo 'n/a' )"
success "════════════════════════════════════════════════"
echo ""
