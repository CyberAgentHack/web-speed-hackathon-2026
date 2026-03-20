# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.0
ARG PNPM_VERSION=10.32.1
ARG BUN_VERSION=1.2.21

# --- Build stage: Node.js for client Vite build + pnpm install ---
FROM node:${NODE_VERSION}-slim AS build

ENV PNPM_HOME=/pnpm

WORKDIR /app
RUN --mount=type=cache,target=/root/.npm npm install -g pnpm@${PNPM_VERSION}

COPY ./application/package.json ./application/pnpm-lock.yaml ./application/pnpm-workspace.yaml ./
COPY ./application/client/package.json ./client/package.json
COPY ./application/server/package.json ./server/package.json
RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile

COPY ./application .

RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

RUN --mount=type=cache,target=/pnpm/store CI=true pnpm install --frozen-lockfile --prod --filter @web-speed-hackathon-2026/server

# --- Runtime stage: Bun ---
FROM oven/bun:${BUN_VERSION}-slim

LABEL fly_launch_runtime="Bun"

WORKDIR /app

COPY --from=build /app /app

EXPOSE 8080
WORKDIR /app/server
CMD [ "bun", "src/index.ts" ]
