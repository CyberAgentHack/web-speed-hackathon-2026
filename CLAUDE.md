# CLAUDE.md — Web Speed Hackathon 2026

## Context

This is a **competitive performance tuning hackathon** (2-day, CyberAgent-hosted).
The goal is to improve Lighthouse scores of a deliberately slow "fake SNS app".
Every minute counts. Be concise, action-oriented, and avoid unnecessary refactors.

## Project Structure

```
application/
  client/          # React + Webpack frontend (main optimization target)
  server/          # Express + TypeScript backend (replaceable)
  e2e/             # E2E tests — DO NOT break these
  public/          # Static assets (images, fonts, etc.)
  package.json
  pnpm-lock.yaml
scoring-tool/      # Scoring tool — DO NOT modify
docs/              # regulation.md, scoring.md, development.md — READ FIRST
Dockerfile
fly.toml           # Fly.io deploy config
mise.toml
```

## Critical Rules

1. **NEVER modify files under `scoring-tool/`**
2. **NEVER break E2E tests or VRT (Visual Regression Tests)** — this causes disqualification
3. **NEVER change seed data in a way that alters generated content** (e.g. removing faker calls shifts RNG state)
4. **Always preserve visual appearance** — pixel-level regressions = disqualification
5. **Check regulation.md before any major change** — when in doubt, don't change it

## Operator Style

- The human operator has **ISUCON experience** (backend optimization) but is **not a frontend expert**
- The operator will write code themselves in many cases — Claude is used for **investigation, analysis, and assistance**
- When asked to investigate, provide **specific file paths, line numbers, and concrete findings**
- When suggesting fixes, provide **minimal diffs** — not full file rewrites
- Prioritize **high-impact, low-risk** changes over ambitious refactors

## Scoring

- Lighthouse-based scoring (FCP, LCP, TBT, CLS, SI)
- Multiple pages scored, some with user-flow tests (login, navigation)
- Total score = sum of all page scores
- Score is measured by GitHub Actions on the deployed PR environment

## Key Investigation Commands

```bash
# Build and analyze bundle
cd application && pnpm build

# Run E2E tests locally (check package.json for exact script name)
cd application && pnpm e2e

# Run dev server
cd application && pnpm dev

# Check bundle output size
ls -lah application/dist/
```

## Optimization Priorities (from past WSH winners)

### Phase 1 — Quick wins (first few hours)
- [ ] Fix webpack config (mode: production, sourcemap, chunk splitting)
- [ ] Remove obviously wrong polyfills or unnecessary dependencies
- [ ] Remove intentional delays (setTimeout, artificial latency in fetch)
- [ ] Fix cache headers (remove no-store, set proper cache-control)
- [ ] Remove intentional payload bloat in API responses

### Phase 2 — Medium effort
- [ ] Image optimization (convert to AVIF/WebP, resize)
- [ ] Bundle size reduction (replace heavy libs with lighter alternatives)
- [ ] API response trimming (remove unused fields, add limits)
- [ ] Fix re-render issues (state management selectors, unnecessary renders)
- [ ] Add DB indexes if applicable

### Phase 3 — Advanced
- [ ] SSR implementation or fix
- [ ] Code splitting and lazy loading
- [ ] CLS fixes (aspect ratios, layout stability)
- [ ] TBT fixes (break up long tasks, requestIdleCallback)

## Common WSH Traps to Look For

- `mode: "none"` or `mode: "development"` in webpack config
- Inline source maps (`devtool: "inline-source-map"`)
- Disabled chunk splitting / code splitting
- Huge libraries for tiny features (FFmpeg for thumbnails, lodash for one function)
- Multiple libraries doing the same thing (e.g. 3 video players)
- CSS runtime causing excessive re-renders (e.g. UnoCSS runtime mode)
- `cache-control: no-store` on all responses
- Intentional `randomBytes()` or padding bloat in responses
- Validation libraries (zod, drizzle schemas) bundled on client side
- `useStore((s) => s)` pattern causing full re-renders on every state change
- Polyfills for features Chrome already supports natively
- Missing `loading="lazy"` on off-screen images
- preload tags for ALL assets instead of critical ones only

## Response Format for Investigations

When investigating code, always report findings like this:

```
FILE: path/to/file.ts:42
ISSUE: webpack mode is set to "none", disabling all optimizations
IMPACT: HIGH
FIX: Change mode to "production"
```

Group findings by impact level (HIGH first).
