# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.0
ARG PNPM_VERSION=10.32.1

FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

ENV PNPM_HOME=/pnpm

WORKDIR /app
RUN --mount=type=cache,target=/root/.npm npm install -g pnpm@${PNPM_VERSION}

# ── deps-full: full install (for client build) ────────────────────────────────
FROM base AS deps-full

COPY ./application/package.json ./application/pnpm-lock.yaml ./application/pnpm-workspace.yaml ./
COPY ./application/client/package.json ./client/package.json
COPY ./application/server/package.json ./server/package.json
RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile

# ── deps-prod: server-only prod install (runs in parallel with deps-full) ─────
FROM base AS deps-prod

COPY ./application/package.json ./application/pnpm-lock.yaml ./application/pnpm-workspace.yaml ./
COPY ./application/client/package.json ./client/package.json
COPY ./application/server/package.json ./server/package.json
RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile --prod --filter @web-speed-hackathon-2026/server

# ── build: compile client only (server source never needed here) ──────────────
FROM deps-full AS build

COPY ./application/client ./client
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# ── final image ───────────────────────────────────────────────────────────────
FROM base

# Workspace manifests (pnpm needs these to resolve --filter server start)
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/client/package.json ./client/package.json

# Server: only runtime-necessary files (no scripts/, no openapi.yaml)
COPY ./application/server/package.json ./server/package.json
COPY ./application/server/tsconfig.json ./server/tsconfig.json
COPY ./application/server/database.sqlite ./server/database.sqlite
COPY ./application/server/src ./server/src

# Built client output (served as static files by the server)
COPY --from=build /app/dist ./dist

# Seed images — large but required at runtime
COPY ./application/public ./public

# Production node_modules (from clean server-only install, not pruned from full)
COPY --from=deps-prod /app/node_modules ./node_modules

EXPOSE 8080
CMD [ "pnpm", "start" ]
