# syntax=docker/dockerfile:1

ARG BUN_VERSION=1.3.9

FROM oven/bun:${BUN_VERSION} AS base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app

FROM base AS build

COPY ./application/package.json ./application/bun.lock ./
COPY ./application/client/package.json ./client/package.json
COPY ./application/server/package.json ./server/package.json
COPY ./application/e2e/package.json ./e2e/package.json
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile

COPY ./application .

RUN NODE_OPTIONS="--max-old-space-size=4096" bun run build

RUN --mount=type=cache,target=/root/.bun/install/cache CI=true bun install --frozen-lockfile --production --filter @web-speed-hackathon-2026/server

FROM base

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

COPY --from=build /app /app

EXPOSE 8080
CMD [ "bun", "run", "start" ]
