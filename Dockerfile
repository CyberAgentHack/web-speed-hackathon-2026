# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.0
ARG PNPM_VERSION=10.32.1

FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

ENV PNPM_HOME=/pnpm

WORKDIR /app
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@${PNPM_VERSION}

FROM base AS build

COPY ./application/package.json ./application/pnpm-lock.yaml ./application/pnpm-workspace.yaml ./
COPY ./application/client/package.json ./client/package.json
COPY ./application/server/package.json ./server/package.json
RUN pnpm install --frozen-lockfile

COPY ./application .

RUN echo "cache-bust-v3" && NODE_OPTIONS="--max-old-space-size=4096" pnpm build

RUN CI=true pnpm install --frozen-lockfile --prod --filter @web-speed-hackathon-2026/server

FROM base

COPY --from=build /app /app

EXPOSE 8080
CMD [ "pnpm", "start" ]