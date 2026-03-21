# syntax=docker/dockerfile:1

ARG BUN_VERSION=1.3.11

# Build stage: use Bun for package management + Node.js for webpack
FROM oven/bun:${BUN_VERSION} AS build

# Install Node.js (for webpack) and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs npm python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy application source
COPY ./application .

# Install all dependencies with Bun
RUN bun install --frozen-lockfile

# Build client using Node.js (webpack requires real node, not bun shim)
WORKDIR /app/client
RUN NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4096" node ./node_modules/.bin/webpack --mode production

# Verify dist was created
WORKDIR /app
RUN test -d dist/scripts && echo "dist built successfully" || (echo "ERROR: dist not found" && ls -la /app && exit 1)

# Production stage: use Bun for runtime (fast startup + native SQLite)
FROM oven/bun:${BUN_VERSION}-slim AS production

LABEL fly_launch_runtime="Bun"

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r bunjs && useradd -r -g bunjs bunjs

WORKDIR /app

# Copy only production dependencies and built artifacts
COPY --from=build --chown=bunjs:bunjs /app/package.json /app/bun.lock* ./
COPY --from=build --chown=bunjs:bunjs /app/server ./server
COPY --from=build --chown=bunjs:bunjs /app/client/package.json ./client/package.json
COPY --from=build --chown=bunjs:bunjs /app/dist ./dist
COPY --from=build --chown=bunjs:bunjs /app/public ./public
COPY --from=build --chown=bunjs:bunjs /app/node_modules ./node_modules

RUN mkdir -p /app/upload/images /app/upload/movies /app/upload/sounds && \
    chown -R bunjs:bunjs /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Switch to non-root user
USER bunjs

EXPOSE 8080

# Use dumb-init to handle signals properly and prevent zombie processes
CMD ["dumb-init", "bun", "server/src/index.ts"]
