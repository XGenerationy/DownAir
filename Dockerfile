FROM node:22-alpine3.24 AS base

# ── Dependencies ────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Build client ────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build

# ── Production ──────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache python3=3.14.7-r1 py3-pip=26.1.2-r0 ffmpeg=8.1.2-r0 curl=8.22.0-r0 \
 && pip3 install --no-cache-dir --break-system-packages yt-dlp==2026.8.19

RUN addgroup --system --gid 1001 downair && \
    adduser --system --uid 1001 downair

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY server ./server
COPY shared ./shared
COPY drizzle.config.ts ./
COPY scripts ./scripts

USER downair
ENV APP_PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -fsS http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "--import", "tsx/esm", "server/index.ts"]
