# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.14.0
ARG PNPM_VERSION=10.32.1

FROM node:${NODE_VERSION}-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

FROM base AS deps

COPY ./application/package.json ./application/pnpm-lock.yaml ./application/pnpm-workspace.yaml ./
COPY ./application/client/package.json ./client/package.json
COPY ./application/server/package.json ./server/package.json
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build

COPY ./application ./

RUN mkdir -p /app/server/upload

RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter @web-speed-hackathon-2026/client build
RUN pnpm --filter @web-speed-hackathon-2026/server build

FROM deps AS prod-deps

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store CI=true pnpm install --frozen-lockfile --prod --filter @web-speed-hackathon-2026/server

FROM gcr.io/distroless/nodejs24-debian13 AS runtime

LABEL fly_launch_runtime="Node.js"

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/server/database.sqlite ./server/database.sqlite
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/upload ./server/upload
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/package.json ./server/package.json

EXPOSE 8080
CMD ["./server/dist/index.js"]
