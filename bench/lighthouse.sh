#!/usr/bin/env bash
set -uo pipefail
# Note: -e を外して lighthouse の非ゼロ終了でスクリプトが死なないようにする

# =============================================================================
# lighthouse.sh — Lighthouse 統計的ベンチマーク
#
# 採点対象ページを N 回ずつ計測し、統計量を算出する。
# 1つずつ逐次実行（Chrome がメモリを大量消費するため）。
#
# Usage:
#   ./bench/lighthouse.sh [RUNS] [BASE_URL]
#   RUNS      計測回数（デフォルト: 3）
#   BASE_URL  対象URL（デフォルト: http://localhost:3000）
# =============================================================================

RUNS="${1:-3}"
BASE_URL="${2:-http://localhost:3000}"

if [ -n "${BENCH_OUTDIR:-}" ]; then
  OUTDIR="${BENCH_OUTDIR}/lighthouse"
else
  COMMIT_HASH="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
  [ -n "$(git status --porcelain 2>/dev/null)" ] && COMMIT_HASH="${COMMIT_HASH}-dirty"
  OUTDIR="bench-results/${COMMIT_HASH}/lighthouse"
fi

mkdir -p "${OUTDIR}"

# 採点対象ページ（scoring-tool から抽出）
declare -A PAGES=(
  [home]="/"
  [post]="/posts/ff93a168-ea7c-4202-9879-672382febfda"
  [post_photo]="/posts/fe6712a1-d9e4-4f6a-987d-e7d08b7f8a46"
  [post_video]="/posts/fff790f5-99ea-432f-8f79-21d3d49efd1a"
  [post_audio]="/posts/fefe75bd-1b7a-478c-8ecc-2c1ab38b821e"
  [search]="/search"
  [terms]="/terms"
)

# Lighthouse は CHROME_PATH で Chrome バイナリを探す
if [ -z "${CHROME_PATH:-}" ]; then
  for candidate in chromium chromium-browser google-chrome; do
    found="$(command -v "${candidate}" 2>/dev/null || true)"
    if [ -n "${found}" ]; then
      CHROME_PATH="${found}"
      break
    fi
  done
  CHROME_PATH="${CHROME_PATH:-chromium}"
fi
export CHROME_PATH
CHROME_FLAGS="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage"

echo "=== Lighthouse Benchmark ==="
echo "Runs: ${RUNS} | Base: ${BASE_URL} | Chrome: ${CHROME_PATH} | Output: ${OUTDIR}"
echo ""

FAILED_COUNT=0

for name in "${!PAGES[@]}"; do
  page_path="${PAGES[$name]}"
  page_dir="${OUTDIR}/${name}"
  mkdir -p "${page_dir}"

  echo "── ${name} (${page_path}) ──"

  for i in $(seq 1 "${RUNS}"); do
    echo -n "  run ${i}/${RUNS}... "
    lh_exit=0
    npx lighthouse "${BASE_URL}${page_path}" \
      --output=json \
      --output-path="${page_dir}/run_${i}.json" \
      --chrome-flags="${CHROME_FLAGS}" \
      --only-categories=performance \
      --quiet \
      2>"${page_dir}/run_${i}.log" || lh_exit=$?

    if [ "${lh_exit}" -ne 0 ] || [ ! -f "${page_dir}/run_${i}.json" ]; then
      echo "FAILED (exit=${lh_exit}, log: ${page_dir}/run_${i}.log)"
      FAILED_COUNT=$((FAILED_COUNT + 1))
    else
      score=$(node -e "
        const r = JSON.parse(require('fs').readFileSync('${page_dir}/run_${i}.json','utf8'));
        console.log((r.categories.performance.score * 100).toFixed(0));
      " 2>/dev/null || echo "ERR")
      echo "score=${score}"
    fi
  done
  echo ""
done

echo "=== Aggregating ==="
node bench/aggregate-lighthouse.mjs "${OUTDIR}" || echo "Aggregation failed"

echo ""
echo "Results saved to: ${OUTDIR}"
echo "Summary: ${OUTDIR}/summary.json"
if [ "${FAILED_COUNT}" -gt 0 ]; then
  echo "WARNING: ${FAILED_COUNT} run(s) failed"
fi
