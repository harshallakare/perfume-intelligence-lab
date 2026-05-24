# ─────────────────────────────────────────────────────────────────────────────
# Perfume Intelligence Lab — Multi-stage Dockerfile (MySQL edition)
#
# Stages:
#   deps    — install all npm dependencies
#   builder — generate Prisma client + build Next.js
#   runner  — lean production image
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Build tools needed for native npm modules (better-sqlite3 in package.json)
RUN apk add --no-cache python3 make g++

COPY frontend/package*.json ./
RUN npm ci

# ── Stage 2: Build the application ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the full frontend source
COPY frontend/ ./

# ── Override SQLite-specific files with MySQL versions ──
# These replace db.ts (removes better-sqlite3 adapter) and schema.prisma
# (switches datasource to MySQL) without touching local dev files.
COPY docker/schema.mysql.prisma ./prisma/schema.prisma
COPY docker/db.mysql.ts         ./src/lib/db.ts
COPY docker/prisma.config.ts    ./prisma.config.ts

# Generate Prisma client for MySQL
# DATABASE_URL is a dummy here — Prisma generate only needs the schema
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/pil"
RUN npx prisma generate

# Build Next.js for production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Lightweight runtime tools
RUN apk add --no-cache curl

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# ── Copy built application ──
COPY --from=builder --chown=nextjs:nodejs /app/.next        ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public       ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

# ── Copy Prisma (schema + migrations + seed — needed at runtime) ──
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# ── Copy entrypoint ──
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/stats || exit 1

ENTRYPOINT ["./entrypoint.sh"]
