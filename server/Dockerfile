# =============================================================================
# AVELIS — Production Dockerfile
# =============================================================================
#
# Stack : Node.js (ESM) · Express · Prisma · Supabase (PostgreSQL)
# Base  : node:22-alpine  (LTS — smaller image, musl libc)
#
# Fallback: If `npx prisma generate` fails on Alpine due to an OpenSSL/musl
# binary error, replace `node:22-alpine` with `node:22-slim` (Debian-based,
# glibc + OpenSSL pre-installed). Everything else stays identical.
#
# NOTE: prisma CLI is in devDependencies — `npm ci` (without --omit=dev) is
# intentional so the CLI is available for `npx prisma generate`. After
# generation, devDependencies are pruned with `npm prune --omit=dev` to
# keep the final image lean. @prisma/client (a production dep) is preserved.
# =============================================================================

FROM node:22-alpine

WORKDIR /app

# ── 1. Install dependencies (including devDeps for prisma CLI) ───────────────
COPY package*.json ./
RUN npm ci

# ── 2. Generate Prisma Client ────────────────────────────────────────────────
COPY prisma ./prisma
RUN npx prisma generate

# ── 3. Prune devDependencies (prisma CLI no longer needed) ──────────────────
RUN npm prune --omit=dev

# ── 4. Copy application source and runtime assets ───────────────────────────
COPY src ./src
COPY data ./data

# ── 5. Environment ───────────────────────────────────────────────────────────
ENV NODE_ENV=production

# ── 6. Expose application port ───────────────────────────────────────────────
EXPOSE 5000

# ── 7. Health Check ──────────────────────────────────────────────────────────
# Uses wget (built into Alpine). Probes the real /api/v1/health endpoint which
# performs a live DB ping. Container shows healthy/unhealthy in `docker ps`.
# start-period=30s gives Prisma time to connect to Supabase on cold start.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

# ── 8. Start ─────────────────────────────────────────────────────────────────
CMD ["npm", "start"]
