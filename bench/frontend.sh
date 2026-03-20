#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# frontend.sh — フロントエンドバンドル分析 + 転送量計測
#
# 1. バンドルサイズ分析（静的、1回実行）
# 2. HTTP転送量を N 回計測（curl で gzip/brotli 含む実転送量）
# 3. リソース別内訳
#
# Usage:
#   ./bench/frontend.sh [RUNS] [BASE_URL]
#   RUNS      計測回数（デフォルト: 5）
#   BASE_URL  対象URL（デフォルト: http://localhost:3000）
# =============================================================================

RUNS="${1:-5}"
BASE_URL="${2:-http://localhost:3000}"

if [ -n "${BENCH_OUTDIR:-}" ]; then
  OUTDIR="${BENCH_OUTDIR}/frontend"
else
  COMMIT_HASH="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
  [ -n "$(git status --porcelain 2>/dev/null)" ] && COMMIT_HASH="${COMMIT_HASH}-dirty"
  OUTDIR="bench-results/${COMMIT_HASH}/frontend"
fi
DIST_DIR="application/dist"

mkdir -p "${OUTDIR}"

echo "=== Frontend Benchmark ==="
echo "Runs: ${RUNS} | Base: ${BASE_URL} | Output: ${OUTDIR}"
echo ""

# ---------------------------------------------------------------------------
# 0. ビルド（dist/ が無い場合は自動実行）
# ---------------------------------------------------------------------------
if [ ! -d "${DIST_DIR}" ]; then
  echo "── Building (dist/ not found) ──"
  (cd application && pnpm build)
  echo ""
fi

# ---------------------------------------------------------------------------
# 1. バンドルサイズ分析（静的 dist/ サマリー）
# ---------------------------------------------------------------------------
echo "── Bundle Size Analysis ──"

if [ -d "${DIST_DIR}" ]; then
  echo ""
  echo "  Directory size: $(du -sh "${DIST_DIR}" 2>/dev/null | cut -f1)"

  # JS/CSS/Other のファイル数とサイズ
  js_size=$(find "${DIST_DIR}" -name '*.js' -type f -exec stat -c%s {} + 2>/dev/null | awk '{s+=$1} END {print s+0}')
  css_size=$(find "${DIST_DIR}" -name '*.css' -type f -exec stat -c%s {} + 2>/dev/null | awk '{s+=$1} END {print s+0}')
  js_count=$(find "${DIST_DIR}" -name '*.js' -type f 2>/dev/null | wc -l)
  css_count=$(find "${DIST_DIR}" -name '*.css' -type f 2>/dev/null | wc -l)

  echo "  JS:  ${js_count} files, $(echo "scale=2; ${js_size}/1024/1024" | bc) MB"
  echo "  CSS: ${css_count} files, $(echo "scale=2; ${css_size}/1024" | bc) KB"
else
  echo "  ${DIST_DIR} not found. Run 'pnpm build' first."
fi

echo ""

# ---------------------------------------------------------------------------
# 2. HTTP 転送量計測（N 回）
# ---------------------------------------------------------------------------
echo "── HTTP Transfer Size (${RUNS} runs) ──"

PAGES=(
  "home:/"
  "post:/posts/ff93a168-ea7c-4202-9879-672382febfda"
  "search:/search"
  "terms:/terms"
)

transfer_json="${OUTDIR}/transfer.json"
echo "{" > "${transfer_json}"
first_page=true

for entry in "${PAGES[@]}"; do
  name="${entry%%:*}"
  url_path="${entry#*:}"
  full_url="${BASE_URL}${url_path}"

  echo "  ${name} (${url_path}):"

  sizes=()
  ttfbs=()

  for i in $(seq 1 "${RUNS}"); do
    # curl で HTML 転送量 + TTFB を取得
    result=$(curl -sS -o /dev/null \
      -w '{"size_download":%{size_download},"time_starttransfer":%{time_starttransfer},"time_total":%{time_total}}' \
      --compressed \
      "${full_url}" 2>/dev/null || echo '{"size_download":0,"time_starttransfer":0,"time_total":0}')

    size=$(echo "${result}" | jq '.size_download')
    ttfb=$(echo "${result}" | jq '.time_starttransfer * 1000')  # → ms

    sizes+=("${size}")
    ttfbs+=("${ttfb}")

    echo -n "    run ${i}: size=${size}B  TTFB=${ttfb}ms"
    echo ""
  done

  sizes_json=$(printf '%s\n' "${sizes[@]}" | jq -s '.')
  ttfbs_json=$(printf '%s\n' "${ttfbs[@]}" | jq -s '.')

  if [ "${first_page}" = true ]; then
    first_page=false
  else
    echo "," >> "${transfer_json}"
  fi
  echo "\"${name}\": {\"transfer_bytes\": ${sizes_json}, \"ttfb_ms\": ${ttfbs_json}}" >> "${transfer_json}"

  echo ""
done

echo "}" >> "${transfer_json}"

# ---------------------------------------------------------------------------
# 3. bundle-stats 分析（ビルドツール非依存）
# ---------------------------------------------------------------------------
BUNDLE_STATS_JSON="application/bundle-stats.json"

echo "── Bundle Stats Analysis ──"

if [ -f "${BUNDLE_STATS_JSON}" ]; then
  cp "${BUNDLE_STATS_JSON}" "${OUTDIR}/bundle-stats.json"

  node -e "
    const data = JSON.parse(require('fs').readFileSync('${BUNDLE_STATS_JSON}', 'utf8'));

    // Summary metrics
    console.log('  Summary:');
    for (const item of (data.summary?.webpack || [])) {
      console.log('    ' + item.label + ': ' + item.displayValue);
    }

    // Size by type
    console.log('');
    console.log('  Size by type:');
    for (const s of (data.sizes || [])) {
      const val = s.runs?.[0]?.displayValue || '0B';
      if (val !== '0B') console.log('    ' + s.label + ': ' + val);
    }

    // Top 15 assets by size
    console.log('');
    console.log('  Top 15 assets:');
    const assets = (data.assets || [])
      .map(a => ({ name: a.runs?.[0]?.name || a.label, size: a.runs?.[0]?.value || 0, initial: a.runs?.[0]?.isInitial }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 15);
    for (const a of assets) {
      const mb = (a.size / 1024 / 1024).toFixed(2);
      const kb = (a.size / 1024).toFixed(1);
      const display = a.size > 1024 * 1024 ? mb + ' MB' : kb + ' KB';
      const tag = a.initial ? ' [initial]' : '';
      console.log('    ' + display.padStart(10) + '  ' + a.name + tag);
    }

    // Top 10 packages by size
    if (data.packages?.length) {
      console.log('');
      console.log('  Top 10 packages:');
      const pkgs = [...data.packages]
        .map(p => ({ name: p.label, size: p.runs?.[0]?.value || 0 }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 10);
      for (const p of pkgs) {
        const kb = (p.size / 1024).toFixed(1);
        console.log('    ' + kb.padStart(10) + ' KB  ' + p.name);
      }
    }

    // Insights
    if (data.insights?.length) {
      console.log('');
      console.log('  Insights:');
      for (const i of data.insights.slice(0, 5)) {
        console.log('    - ' + i.label);
      }
    }
  "
else
  echo "  bundle-stats.json not found. Run 'pnpm build' first."
fi

echo ""
echo "=== Aggregating ==="
node bench/aggregate-frontend.mjs "${OUTDIR}"

echo ""
echo "Results saved to: ${OUTDIR}"
