# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.0
ARG PNPM_VERSION=10.32.1

FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

ENV PNPM_HOME=/pnpm

WORKDIR /app
RUN --mount=type=cache,target=/root/.npm npm install -g pnpm@${PNPM_VERSION}

FROM base AS manifests

COPY ./application/package.json ./application/pnpm-lock.yaml ./application/pnpm-workspace.yaml ./
COPY ./application/client/package.json ./client/package.json
COPY ./application/server/package.json ./server/package.json
RUN --mount=type=cache,target=/pnpm/store \
  pnpm fetch --frozen-lockfile \
  --filter @web-speed-hackathon-2026/client \
  --filter @web-speed-hackathon-2026/server

FROM manifests AS client-deps

RUN --mount=type=cache,target=/pnpm/store \
  pnpm install --frozen-lockfile --offline --filter @web-speed-hackathon-2026/client

FROM base AS public-assets

COPY ./application/public ./public

FROM client-deps AS client-build

COPY ./application/client ./client
COPY --from=public-assets /app/public ./public
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter @web-speed-hackathon-2026/client build

FROM manifests AS server-deps

RUN --mount=type=cache,target=/pnpm/store \
  CI=true pnpm install --frozen-lockfile --offline --prod --filter @web-speed-hackathon-2026/server

FROM base AS runtime

ENV NODE_ENV=production

COPY --from=server-deps /app/package.json /app/pnpm-workspace.yaml /app/
COPY --from=server-deps /app/node_modules /app/node_modules
COPY --from=server-deps /app/server/node_modules /app/server/node_modules
COPY ./application/server/package.json ./application/server/tsconfig.json /app/server/
COPY ./application/server/database.sqlite /app/server/database.sqlite
COPY ./application/server/src /app/server/src
COPY --from=public-assets /app/public /app/public
COPY --from=client-build /app/dist /app/dist

EXPOSE 8080
CMD [ "pnpm", "start" ]
