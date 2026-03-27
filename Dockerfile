# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.0

FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Bun"

WORKDIR /app

RUN npm install -g bun

FROM base AS build

RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY ./application/package.json ./application/bun.lock ./
COPY ./application/client/package.json ./client/package.json
COPY ./application/server/package.json ./server/package.json
COPY ./application/e2e/package.json ./e2e/package.json

RUN bun install --frozen-lockfile

COPY ./application .

RUN bun run build

FROM base AS production

COPY --from=build /app /app

EXPOSE 8080

CMD ["bun", "run", "start"]
