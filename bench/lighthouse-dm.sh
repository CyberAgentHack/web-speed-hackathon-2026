#!/usr/bin/env bash
set -uo pipefail

# =============================================================================
# lighthouse-dm.sh — 認証が必要な DM ページの Lighthouse user-flow ベンチマーク
#
# Puppeteer でサインイン後、Lighthouse user-flow API で計測する。
# scoring-tool と同じ手法（startNavigation / endNavigation）を再現。
#
# Usage:
#   ./bench/lighthouse-dm.sh [RUNS] [BASE_URL]
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

mkdir -p "${OUTDIR}/dm_list" "${OUTDIR}/dm_detail"

# Chrome バイナリ
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

echo "=== Lighthouse DM Benchmark (user-flow) ==="
echo "Runs: ${RUNS} | Base: ${BASE_URL} | Chrome: ${CHROME_PATH} | Output: ${OUTDIR}"
echo ""

FAILED_COUNT=0

# DM ページ定義
declare -A DM_PAGES=(
  [dm_list]="/dm"
  [dm_detail]="/dm/33881deb-da8a-4ca9-a153-2f80d5fa7af8"
)

for name in "${!DM_PAGES[@]}"; do
  dm_path="${DM_PAGES[$name]}"
  page_dir="${OUTDIR}/${name}"
  mkdir -p "${page_dir}"

  echo "── ${name} (${dm_path}) ──"

  for i in $(seq 1 "${RUNS}"); do
    echo -n "  run ${i}/${RUNS}... "

    lh_exit=0
    node bench/lighthouse-dm-runner.mjs \
      "${BASE_URL}" \
      "${dm_path}" \
      "${page_dir}/run_${i}.json" \
      "${CHROME_PATH}" \
      2>"${page_dir}/run_${i}.log" || lh_exit=$?

    if [ "${lh_exit}" -ne 0 ] || [ ! -f "${page_dir}/run_${i}.json" ]; then
      echo "FAILED (exit=${lh_exit}, log: ${page_dir}/run_${i}.log)"
      FAILED_COUNT=$((FAILED_COUNT + 1))
    else
      score=$(node -e "
        const r = JSON.parse(require('fs').readFileSync('${page_dir}/run_${i}.json','utf8'));
        const a = r.audits || {};
        const s = (k) => (a[k]?.score ?? 0);
        const total = s('cumulative-layout-shift')*25 + s('first-contentful-paint')*10 + s('largest-contentful-paint')*25 + s('speed-index')*10 + s('total-blocking-time')*30;
        console.log(total.toFixed(1));
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
if [ "${FAILED_COUNT}" -gt 0 ]; then
  echo "WARNING: ${FAILED_COUNT} run(s) failed"
fi
