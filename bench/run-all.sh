#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# run-all.sh — 全レイヤーベンチマーク一括実行
#
# 結果は bench-results/{commit_hash}/ 以下にレイヤー別で保存される。
# 各ステップは systemd-run で cgroup メモリ上限を強制する。
#
# Usage:
#   ./bench/run-all.sh [RUNS] [BASE_URL] [MEM_LIMIT]
#   RUNS       計測回数（デフォルト: 3）。DB は RUNS×4 回。
#   BASE_URL   対象URL（デフォルト: http://localhost:3000）
#   MEM_LIMIT  各ステップのメモリ上限（デフォルト: 8G）
#
# 前提: アプリケーションサーバーが起動済みであること
# =============================================================================

RUNS="${1:-3}"
BASE_URL="${2:-http://localhost:3000}"
MEM_LIMIT="${3:-8G}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# systemd-run でメモリ制限付き実行するラッパー
# 上限を超えると OOM killer が即座にプロセスを kill する
run_capped() {
  local label="$1"
  shift
  if command -v systemd-run &>/dev/null; then
    systemd-run --user --scope \
      -p MemoryMax="${MEM_LIMIT}" \
      -p MemorySwapMax=0 \
      --description="bench: ${label}" \
      "$@"
  else
    # systemd-run が使えない環境ではそのまま実行
    "$@"
  fi
}

# commit hash を取得
COMMIT_HASH="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
COMMIT_FULL="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
COMMIT_MSG="$(git log -1 --pretty=%s 2>/dev/null || echo '')"
IS_DIRTY=""
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  COMMIT_HASH="${COMMIT_HASH}-dirty"
  IS_DIRTY="true"
fi

export BENCH_COMMIT_HASH="${COMMIT_HASH}"
export BENCH_OUTDIR="bench-results/${COMMIT_HASH}"

mkdir -p "${BENCH_OUTDIR}"

# メタデータ保存
cat > "${BENCH_OUTDIR}/meta.json" <<EOMETA
{
  "commitHash": "${COMMIT_FULL}",
  "commitShort": "${COMMIT_HASH}",
  "commitMessage": $(echo "${COMMIT_MSG}" | jq -Rs .),
  "dirty": ${IS_DIRTY:-false},
  "timestamp": "$(date -Iseconds)",
  "runs": ${RUNS},
  "baseUrl": "${BASE_URL}"
}
EOMETA

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       Web Speed Hackathon 2026 — Benchmark Suite        ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Commit:    $(printf '%-43s' "${COMMIT_HASH}")║"
echo "║  Runs:      $(printf '%-43s' "${RUNS}")║"
echo "║  Base:      $(printf '%-43s' "${BASE_URL}")║"
echo "║  Mem limit: $(printf '%-43s' "${MEM_LIMIT}")║"
echo "║  Output:    $(printf '%-43s' "${BENCH_OUTDIR}")║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# サーバー到達確認
echo "Checking server availability..."
if ! curl -sS -o /dev/null -w '' "${BASE_URL}/" --max-time 10 2>/dev/null; then
  echo "ERROR: Cannot reach ${BASE_URL}. Start the server first."
  echo "  cd application && pnpm start"
  exit 1
fi
echo "  Server is up"
echo ""

# ---------------------------------------------------------------------------
# 1. DB
# ---------------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  [1/4] DB Benchmark"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DB_RUNS=$((RUNS * 4))
run_capped "db" bash "${SCRIPT_DIR}/db.sh" "${DB_RUNS}"
echo ""

# ---------------------------------------------------------------------------
# 2. API
# ---------------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  [2/4] API Benchmark"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
run_capped "api" bash "${SCRIPT_DIR}/api.sh" "${RUNS}" 5 10 "${BASE_URL}"
echo ""

# ---------------------------------------------------------------------------
# 3. Frontend
# ---------------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  [3/4] Frontend Benchmark"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
run_capped "frontend" bash "${SCRIPT_DIR}/frontend.sh" "${RUNS}" "${BASE_URL}"
echo ""

# ---------------------------------------------------------------------------
# 4. Lighthouse (E2E)
# ---------------------------------------------------------------------------
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  [4/4] Lighthouse Benchmark (E2E)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
run_capped "lighthouse" bash "${SCRIPT_DIR}/lighthouse.sh" "${RUNS}" "${BASE_URL}"
echo ""

# ---------------------------------------------------------------------------
# 完了
# ---------------------------------------------------------------------------
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                   Benchmark Complete                    ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Commit: $(printf '%-46s' "${COMMIT_HASH}")║"
echo "║  Output: $(printf '%-46s' "${BENCH_OUTDIR}")║"
echo "║                                                         ║"
echo "║  Compare with another commit:                           ║"
echo "║    ./bench/diff.sh <other_commit_hash>                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
