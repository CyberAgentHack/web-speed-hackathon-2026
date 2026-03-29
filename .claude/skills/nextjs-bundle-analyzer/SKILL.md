---
name: nextjs-bundle-analyzer
description: Analyze Next.js bundle sizes using experimental-analyze and apply optimizations. Use when asked to analyze bundle size, reduce JavaScript payload, optimize build output, check page weight, or improve loading performance in a Next.js project. Triggers on "bundle analysis", "bundle size", "analyze build", "バンドル分析", "バンドルサイズ", "ビルド分析", or "パフォーマンス改善".
---

# Next.js Bundle Analyzer

Analyze Next.js bundle output, identify oversized routes and modules, and apply code-level optimizations.

## Workflow

1. Build with `--experimental-analyze` and measure baseline
2. Read route-level size data from `.next/diagnostics/route-bundle-stats.json`
3. Identify optimization targets
4. Apply optimizations **one at a time**, verifying each with a rebuild
5. Revert changes that show no measurable improvement

## Step 1: Build and Measure Baseline

```bash
cd web && pnpm build --experimental-analyze 2>&1 | tee /tmp/next-build-output.txt
```

Then read per-route sizes from the JSON file (this is more reliable than parsing stdout, especially with Turbopack which omits size info from terminal output):

```bash
python3 -c "
import json
with open('.next/diagnostics/route-bundle-stats.json') as f:
    data = json.load(f)
total = sum(r['firstLoadUncompressedJsBytes'] for r in data)
print(f'Routes: {len(data)}')
print(f'Total (all routes sum): {total:,} bytes')
print(f'Max: {max(r[\"firstLoadUncompressedJsBytes\"] for r in data):,} bytes ({max(data, key=lambda x: x[\"firstLoadUncompressedJsBytes\"])[\"route\"]})')
print(f'Min: {min(r[\"firstLoadUncompressedJsBytes\"] for r in data):,} bytes ({min(data, key=lambda x: x[\"firstLoadUncompressedJsBytes\"])[\"route\"]})')
"
```

**Important:** Save these baseline numbers. Every optimization must be compared against them.

## Step 2: Analyze Route Sizes

Key data sources:
- **`.next/diagnostics/route-bundle-stats.json`** — Per-route `firstLoadUncompressedJsBytes` and chunk list
- **`.next/diagnostics/analyze/data/routes.json`** — Route manifest
- **`.next/diagnostics/analyze/*.txt`** — Per-route module details (may be limited with Turbopack)

Identify:
- The **minimum route size** (shared base cost — all routes pay this)
- The **largest routes** and what they import beyond the shared base
- Heavy dependencies via codebase search (grep for large library imports)

## Step 3: Identify Optimization Targets

Priority order:
1. **Large shared base** — Affects ALL routes. Look at `_app.tsx` dependencies
2. **Route-specific heavy imports** — Libraries/components only used on one route
3. **Conditional dependencies** — Code loaded but only used in one branch (e.g., auth providers)
4. **Heavy utility libraries** — Used in one place but imported statically

## Step 4: Apply and Verify Each Optimization

**CRITICAL: Apply one optimization at a time, rebuild, and verify the size actually decreased.**

```bash
# After each change:
pnpm build 2>&1 | tail -3 && python3 -c "
import json
with open('.next/diagnostics/route-bundle-stats.json') as f:
    data = json.load(f)
total = sum(r['firstLoadUncompressedJsBytes'] for r in data)
print(f'Total: {total:,} bytes (baseline: BASELINE_HERE)')
print(f'Diff: {total - BASELINE_HERE:+,} bytes')
"
```

If the diff is ±0 or positive, **revert the change** — the bundler already handles it or the change is counterproductive.

Read `references/optimization-patterns.md` for the full pattern catalog.

## Known: What Does NOT Work (Next.js 15+)

These optimizations are **automatically applied by Next.js 15+** and adding them manually has zero effect:

- **`optimizePackageImports` for MUI** — Next.js auto-optimizes `@mui/icons-material`, `@mui/material`, `@mui/x-date-pickers`, `@mui/x-charts`
- **MUI icon barrel → deep import conversion** — Turbopack/webpack automatically resolves barrel imports to deep imports for known packages
- **General barrel file optimization** — `optimizePackageImports` covers most popular packages by default

**Always verify before assuming an optimization helps.** The bundler may already handle it.

## Step 5: Final Comparison

```bash
python3 << 'PYEOF'
# Fill in baseline values from Step 1
baseline = { "/route": size, ... }

import json
with open('.next/diagnostics/route-bundle-stats.json') as f:
    data = json.load(f)
after = {r['route']: r['firstLoadUncompressedJsBytes'] for r in data}

print(f"{'Route':30s} {'Before':>12s} {'After':>12s} {'Diff':>10s}")
print('-' * 66)
for route in sorted(baseline.keys(), key=lambda x: baseline[x], reverse=True):
    b, a = baseline[route], after.get(route, 0)
    print(f"{route:30s} {b/1024:>10.0f}KB {a/1024:>10.0f}KB {(a-b)/1024:>+8.0f}KB")
total_b, total_a = sum(baseline.values()), sum(after.values())
print('-' * 66)
print(f"{'TOTAL':30s} {total_b/1024:>10.0f}KB {total_a/1024:>10.0f}KB {(total_a-total_b)/1024:>+8.0f}KB")
print(f"\nTotal reduction: {(total_b-total_a)/1024:.0f}KB ({(total_b-total_a)/total_b*100:.1f}%)")
PYEOF
```
