FROM node:22-alpine AS base

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

RUN apk add --no-cache python3 py3-pip ffmpeg curl \
 && pip3 install --break-system-packages yt-dlp

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
