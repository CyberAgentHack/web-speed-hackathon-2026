# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.0
ARG PNPM_VERSION=10.32.1

FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

ENV PNPM_HOME=/pnpm

WORKDIR /app
RUN --mount=type=cache,target=/root/.npm npm install -g pnpm@${PNPM_VERSION}

FROM base AS build

COPY ./application/package.json ./application/pnpm-lock.yaml ./application/pnpm-workspace.yaml ./
COPY ./application/client/package.json ./client/package.json
COPY ./application/server/package.json ./server/package.json
RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile

COPY ./application/client ./client

RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

FROM base AS runtime-deps

COPY ./application/package.json ./application/pnpm-lock.yaml ./application/pnpm-workspace.yaml ./
COPY ./application/server/package.json ./server/package.json
RUN --mount=type=cache,target=/pnpm/store CI=true pnpm install --frozen-lockfile --prod --filter @web-speed-hackathon-2026/server

FROM base

COPY --from=runtime-deps /app /app
COPY ./application/server/package.json ./server/package.json
COPY ./application/server/tsconfig.json ./server/tsconfig.json
COPY ./application/server/src ./server/src
COPY ./application/server/database.sqlite ./server/database.sqlite
COPY ./application/public ./public
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD [ "pnpm", "start" ]
