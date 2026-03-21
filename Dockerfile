# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.0
ARG PNPM_VERSION=10.32.1

FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /app
RUN --mount=type=cache,target=/root/.npm npm install -g pnpm@${PNPM_VERSION}

# Build stage
FROM base AS build

# Copy package manifests first for better layer caching
COPY ./application/package.json ./application/pnpm-lock.yaml ./application/pnpm-workspace.yaml ./
COPY ./application/client/package.json ./client/package.json
COPY ./application/server/package.json ./server/package.json

# Install all dependencies (including devDependencies for build)
RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile

# Copy application source
COPY ./application .

# Build client with optimized memory settings
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm build

# Prune devDependencies and install only production dependencies for server
RUN --mount=type=cache,target=/pnpm/store CI=true pnpm install --frozen-lockfile --prod --filter @web-speed-hackathon-2026/server

# Production stage
FROM node:${NODE_VERSION}-slim AS production

LABEL fly_launch_runtime="Node.js"

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

WORKDIR /app

# Install pnpm globally
RUN --mount=type=cache,target=/root/.npm npm install -g pnpm@${PNPM_VERSION}

# Copy only production dependencies and built artifacts
COPY --from=build --chown=nodejs:nodejs /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build --chown=nodejs:nodejs /app/server ./server
COPY --from=build --chown=nodejs:nodejs /app/client/package.json ./client/package.json
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/public ./public
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Switch to non-root user
USER nodejs

EXPOSE 8080

# Use dumb-init to handle signals properly and prevent zombie processes
CMD ["dumb-init", "pnpm", "start"]
