#!/usr/bin/env bash
set -euo pipefail

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

CHROME_FLAGS="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage"

echo "=== Lighthouse Benchmark ==="
echo "Runs: ${RUNS} | Base: ${BASE_URL} | Output: ${OUTDIR}"
echo ""

for name in "${!PAGES[@]}"; do
  page_path="${PAGES[$name]}"
  page_dir="${OUTDIR}/${name}"
  mkdir -p "${page_dir}"

  echo "── ${name} (${page_path}) ──"

  for i in $(seq 1 "${RUNS}"); do
    echo -n "  run ${i}/${RUNS}... "
    npx lighthouse "${BASE_URL}${page_path}" \
      --output=json \
      --output-path="${page_dir}/run_${i}.json" \
      --chrome-flags="${CHROME_FLAGS}" \
      --only-categories=performance \
      --quiet \
      2>/dev/null

    # 即座にスコア表示
    score=$(node -e "
      const r = JSON.parse(require('fs').readFileSync('${page_dir}/run_${i}.json','utf8'));
      console.log((r.categories.performance.score * 100).toFixed(0));
    " 2>/dev/null || echo "ERR")
    echo "score=${score}"
  done
  echo ""
done

echo "=== Aggregating ==="
node bench/aggregate-lighthouse.mjs "${OUTDIR}"

echo ""
echo "Results saved to: ${OUTDIR}"
echo "Summary: ${OUTDIR}/summary.json"
