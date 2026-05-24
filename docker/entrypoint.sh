#!/bin/sh
set -e

echo "──────────────────────────────────────────────"
echo "  Perfume Intelligence Lab — Starting up"
echo "──────────────────────────────────────────────"

# ── Wait for MySQL to accept connections ──────────────────────────────────────
echo "[1/4] Waiting for MySQL..."
MAX_RETRIES=30
RETRY=0

until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: MySQL did not become ready after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "  MySQL not ready yet (attempt $RETRY/$MAX_RETRIES) — retrying in 3s..."
  sleep 3
done
echo "  MySQL is ready."

# ── Run migrations ─────────────────────────────────────────────────────────────
echo "[2/4] Running database migrations..."
npx prisma migrate deploy
echo "  Migrations applied."

# ── Seed initial data (safe to run multiple times — uses upsert) ───────────────
echo "[3/4] Seeding initial data..."
npx tsx prisma/seed.ts && echo "  Seed complete." || echo "  Seed skipped (already seeded)."

# ── Start the app ─────────────────────────────────────────────────────────────
echo "[4/4] Starting Next.js on port ${PORT:-3000}..."
echo "──────────────────────────────────────────────"
exec npm start
