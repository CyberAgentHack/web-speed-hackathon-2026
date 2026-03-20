# CLAUDE.md

## Project Overview
Web Speed Hackathon 2026 - SNSアプリ「CaX」のLighthouseスコアを最大化する競技（1150点満点）。
見た目と機能を壊さずにWebパフォーマンスを改善する。

## Tech Stack
- **Frontend**: React 19, Redux, Webpack 5, Babel, PostCSS, Tailwind CSS (CDN), TypeScript
- **Backend**: Express 5, Sequelize 6, SQLite3, WebSocket, TypeScript
- **Runtime**: Node.js 24.14.0, pnpm 10.32.1 (mise で管理)
- **Testing**: Playwright (VRT/E2E), Lighthouse (scoring)

## Directory Structure
```
application/
  client/          # Frontend (React + Webpack)
  server/          # Backend (Express + Sequelize + SQLite)
  e2e/             # E2E/VRT tests (Playwright)
  public/          # Static assets (images, fonts, sounds, videos)
scoring-tool/      # Lighthouse-based scoring tool
docs/              # Rules, scoring, test cases, deployment
```

## Commands
All commands run from `application/` directory:
```bash
# Setup
mise trust && mise install
pnpm install --frozen-lockfile

# Build & Run
pnpm build                    # Webpack build
pnpm start                    # Start server (port 3000)

# Testing
pnpm --filter @web-speed-hackathon-2026/e2e exec playwright install chromium
pnpm run test                 # Run VRT/E2E tests
pnpm run test:update          # Update VRT snapshots

# Code Quality
pnpm run format               # oxlint + oxfmt
pnpm run typecheck            # TypeScript check

# Scoring (from scoring-tool/)
pnpm start --applicationUrl http://localhost:3000
pnpm start --applicationUrl http://localhost:3000 --targetName          # List targets
pnpm start --applicationUrl http://localhost:3000 --targetName "投稿"   # Score specific
```

## Scoring (1150 points max)

### Page Display: 900 points (9 pages x 100)
Pages: Home, Post Detail, Photo Post, Video Post, Audio Post, DM List, DM Detail, Search, Terms

| Metric | Weight | Priority |
|--------|--------|----------|
| Total Blocking Time (TBT) | x30 | Highest |
| Largest Contentful Paint (LCP) | x25 | High |
| Cumulative Layout Shift (CLS) | x25 | High |
| Speed Index (SI) | x10 | Medium |
| First Contentful Paint (FCP) | x10 | Medium |

### Page Interaction: 250 points (5 scenarios x 50)
Scenarios: Auth, DM, Search, Crok, Post
- TBT x25, INP x25
- Only scored if Display >= 300 points

## Regulations (MUST follow)
- `fly.toml` MUST NOT be modified
- VRT tests MUST pass (3% pixel tolerance)
- Crok SSE protocol (`GET /api/v1/crok{?prompt}`) MUST NOT change
- `POST /api/v1/initialize` MUST reset DB to initial state
- Seed data IDs MUST NOT change
- No significant feature loss or design differences in Chrome latest

## Known Performance Issues (Initial State)
- Webpack mode: "none" (no optimization, no minification)
- Babel target: IE 11 (unnecessary polyfills)
- No code splitting or tree shaking
- No image/media optimization
- Tailwind CSS loaded via CDN (full bundle)
- Heavy client-side libraries: jQuery, moment.js, ffmpeg, imagemagick
