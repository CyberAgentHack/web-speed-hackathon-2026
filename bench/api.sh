#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# api.sh — API エンドポイント統計的ベンチマーク（autocannon）
#
# 各エンドポイントを N ラウンド × 各ラウンド D 秒間負荷をかけ、
# ラウンド間の avg latency / rps のばらつきを統計評価する。
#
# Usage:
#   ./bench/api.sh [ROUNDS] [DURATION] [CONNECTIONS] [BASE_URL]
#   ROUNDS       繰り返し回数（デフォルト: 5）
#   DURATION     1ラウンドの秒数（デフォルト: 5）
#   CONNECTIONS  同時接続数（デフォルト: 10）
#   BASE_URL     対象URL（デフォルト: http://localhost:3000）
# =============================================================================

ROUNDS="${1:-5}"
DURATION="${2:-5}"
CONNECTIONS="${3:-10}"
BASE_URL="${4:-http://localhost:3000}"

if [ -n "${BENCH_OUTDIR:-}" ]; then
  OUTDIR="${BENCH_OUTDIR}/api"
else
  COMMIT_HASH="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
  [ -n "$(git status --porcelain 2>/dev/null)" ] && COMMIT_HASH="${COMMIT_HASH}-dirty"
  OUTDIR="bench-results/${COMMIT_HASH}/api"
fi

mkdir -p "${OUTDIR}"

# autocannon がなければインストール案内
if ! command -v npx &>/dev/null; then
  echo "ERROR: npx not found"
  exit 1
fi

# テスト対象エンドポイント（GET のみ — POST は副作用あるため除外）
declare -A ENDPOINTS=(
  [get_posts]="/api/v1/posts?limit=30&offset=0"
  [get_post_detail]="/api/v1/posts/ff93a168-ea7c-4202-9879-672382febfda"
  [get_post_comments]="/api/v1/posts/ff93a168-ea7c-4202-9879-672382febfda/comments?limit=30&offset=0"
  [get_search]="/api/v1/search?q=test&limit=30&offset=0"
  [get_crok_suggestions]="/api/v1/crok/suggestions"
  [get_user]="/api/v1/users/o6yq16leo"
  [get_user_posts]="/api/v1/users/o6yq16leo/posts?limit=30&offset=0"
  [ssr_home]="/"
  [ssr_post]="/posts/ff93a168-ea7c-4202-9879-672382febfda"
  [ssr_search]="/search"
  [ssr_terms]="/terms"
)

echo "=== API Benchmark (autocannon) ==="
echo "Rounds: ${ROUNDS} | Duration: ${DURATION}s | Connections: ${CONNECTIONS}"
echo "Base: ${BASE_URL} | Output: ${OUTDIR}"
echo ""

for name in "${!ENDPOINTS[@]}"; do
  endpoint="${ENDPOINTS[$name]}"
  ep_dir="${OUTDIR}/${name}"
  mkdir -p "${ep_dir}"

  echo "── ${name} (${endpoint}) ──"

  for i in $(seq 1 "${ROUNDS}"); do
    echo -n "  round ${i}/${ROUNDS}... "

    npx autocannon \
      -c "${CONNECTIONS}" \
      -d "${DURATION}" \
      -j \
      "${BASE_URL}${endpoint}" \
      > "${ep_dir}/round_${i}.json" \
      2>/dev/null

    # 即座に要約表示
    node -e "
      const r = JSON.parse(require('fs').readFileSync('${ep_dir}/round_${i}.json','utf8'));
      const lat = r.latency || {};
      const req = r.requests || {};
      const avg = lat.average != null ? lat.average.toFixed(1) : 'N/A';
      const p99 = lat.p99 != null ? lat.p99.toFixed(1) : 'N/A';
      const rps = req.average != null ? req.average.toFixed(0) : 'N/A';
      console.log('avg=' + avg + 'ms  p99=' + p99 + 'ms  rps=' + rps);
    "
  done
  echo ""
done

echo "=== Aggregating ==="
node bench/aggregate-api.mjs "${OUTDIR}"

echo ""
echo "Results saved to: ${OUTDIR}"
echo "Summary: ${OUTDIR}/summary.json"
