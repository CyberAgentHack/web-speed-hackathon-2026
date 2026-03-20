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
# 1. バンドルサイズ分析（静的）
# ---------------------------------------------------------------------------
echo "── Bundle Size Analysis ──"

if [ -d "${DIST_DIR}" ]; then
  echo ""
  echo "  Directory sizes:"
  du -sh "${DIST_DIR}" 2>/dev/null | while read -r line; do echo "    ${line}"; done

  echo ""
  echo "  JS files (top 20 by size):"
  find "${DIST_DIR}" -name '*.js' -exec ls -lhS {} + 2>/dev/null | head -20 | while read -r line; do echo "    ${line}"; done

  echo ""
  echo "  CSS files:"
  find "${DIST_DIR}" -name '*.css' -exec ls -lhS {} + 2>/dev/null | while read -r line; do echo "    ${line}"; done

  echo ""
  echo "  Other assets (top 10 by size):"
  find "${DIST_DIR}" -not -name '*.js' -not -name '*.css' -not -name '*.html' -not -name '*.map' -type f -exec ls -lhS {} + 2>/dev/null | head -10 | while read -r line; do echo "    ${line}"; done

  # JS バイト数をJSON化
  echo "  {" > "${OUTDIR}/bundle_sizes.json"
  first=true
  find "${DIST_DIR}" -name '*.js' -type f | while read -r f; do
    size=$(stat -c%s "${f}" 2>/dev/null || stat -f%z "${f}" 2>/dev/null || echo 0)
    rel=$(echo "${f}" | sed "s|${DIST_DIR}/||")
    if [ "${first}" = true ]; then
      first=false
    else
      echo "," >> "${OUTDIR}/bundle_sizes.json"
    fi
    echo -n "  \"${rel}\": ${size}" >> "${OUTDIR}/bundle_sizes.json"
  done
  echo "" >> "${OUTDIR}/bundle_sizes.json"
  echo "}" >> "${OUTDIR}/bundle_sizes.json"
else
  echo "  ⚠ ${DIST_DIR} not found. Run 'pnpm build' first."
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
# 3. JS / CSS リソース転送量
# ---------------------------------------------------------------------------
echo "── Resource Transfer Sizes ──"

resources_json="${OUTDIR}/resources.json"
echo "{" > "${resources_json}"
first_res=true

RESOURCES=(
  "main_js:/scripts/main.js"
  "main_css:/styles/main.css"
)

for entry in "${RESOURCES[@]}"; do
  res_name="${entry%%:*}"
  res_path="${entry#*:}"
  full_url="${BASE_URL}${res_path}"

  sizes=()
  for i in $(seq 1 "${RUNS}"); do
    size=$(curl -sS -o /dev/null -w '%{size_download}' --compressed "${full_url}" 2>/dev/null || echo "0")
    sizes+=("${size}")
  done

  sizes_json=$(printf '%s\n' "${sizes[@]}" | jq -s '.')

  if [ "${first_res}" = true ]; then
    first_res=false
  else
    echo "," >> "${resources_json}"
  fi
  echo "\"${res_name}\": ${sizes_json}" >> "${resources_json}"

  median=$(printf '%s\n' "${sizes[@]}" | sort -n | awk 'NR==int((NR+1)/2)')
  echo "  ${res_name}: median=${median}B ($(echo "scale=2; ${median}/1024/1024" | bc)MB)"
done

echo "}" >> "${resources_json}"

echo ""
echo "=== Aggregating ==="
node bench/aggregate-frontend.mjs "${OUTDIR}"

echo ""
echo "Results saved to: ${OUTDIR}"
