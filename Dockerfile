# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.0
ARG PNPM_VERSION=10.32.1

FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

ENV PNPM_HOME=/pnpm

WORKDIR /app
RUN --mount=type=cache,id=s/e6939569-67bb-458b-b20c-677ae811a138-/root/.npm,target=/root/.npm npm install -g pnpm@${PNPM_VERSION}

FROM base AS build

COPY ./application/package.json ./application/pnpm-lock.yaml ./application/pnpm-workspace.yaml ./
COPY ./application/client/package.json ./client/package.json
COPY ./application/server/package.json ./server/package.json
RUN --mount=type=cache,id=s/e6939569-67bb-458b-b20c-677ae811a138-/pnpm/store,target=/pnpm/store pnpm install --frozen-lockfile

COPY ./application .

RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

RUN --mount=type=cache,id=s/e6939569-67bb-458b-b20c-677ae811a138-/pnpm/store,target=/pnpm/store CI=true pnpm install --frozen-lockfile --prod --filter @web-speed-hackathon-2026/server

FROM base

RUN apt-get update && apt-get install -y --no-install-recommends \
	libgtk-3.0 \
	libgbm-dev \
	libnss3 \
	libatk-bridge2.0-0 \
	libasound2 \
	ffmpeg \
	libimage-exiftool-perl \
	nkf \
	libc-bin \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=build /app /app

EXPOSE 8080
CMD [ "pnpm", "start" ]
