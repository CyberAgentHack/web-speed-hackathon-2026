#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# diff.sh — commit hash 間のベンチマーク差分比較
#
# Usage:
#   ./bench/diff.sh <commit_a> <commit_b>    # 2つの commit を比較
#   ./bench/diff.sh <commit_a>               # commit_a と現在の HEAD を比較
#   ./bench/diff.sh                           # 直近2つの計測結果を比較
#
# bench-results/{commit_hash}/ 以下の summary.json を全レイヤーで比較する。
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="bench-results"

# ---------------------------------------------------------------------------
# ヘルパー: commit hash のプレフィクスマッチで結果ディレクトリを解決
# ---------------------------------------------------------------------------
resolve_result_dir() {
  local ref="$1"

  # 完全一致
  if [ -d "${RESULTS_DIR}/${ref}" ]; then
    echo "${RESULTS_DIR}/${ref}"
    return 0
  fi

  # プレフィクスマッチ（short hash → full dir name）
  local matches=()
  for d in "${RESULTS_DIR}"/*/; do
    local dirname
    dirname="$(basename "${d}")"
    if [[ "${dirname}" == "${ref}"* ]]; then
      matches+=("${d%/}")
    fi
  done

  if [ ${#matches[@]} -eq 1 ]; then
    echo "${matches[0]}"
    return 0
  elif [ ${#matches[@]} -gt 1 ]; then
    echo "ERROR: Ambiguous commit ref '${ref}'. Matches:" >&2
    for m in "${matches[@]}"; do echo "  $(basename "${m}")" >&2; done
    return 1
  fi

  # git resolve してから再試行
  local resolved
  resolved="$(git rev-parse --short "${ref}" 2>/dev/null || true)"
  if [ -n "${resolved}" ] && [ -d "${RESULTS_DIR}/${resolved}" ]; then
    echo "${RESULTS_DIR}/${resolved}"
    return 0
  fi

  # dirty 付きも探す
  if [ -n "${resolved}" ] && [ -d "${RESULTS_DIR}/${resolved}-dirty" ]; then
    echo "${RESULTS_DIR}/${resolved}-dirty"
    return 0
  fi

  echo "ERROR: No benchmark results found for '${ref}'" >&2
  echo "Available results:" >&2
  list_results >&2
  return 1
}

# ---------------------------------------------------------------------------
# ヘルパー: 利用可能な結果一覧
# ---------------------------------------------------------------------------
list_results() {
  if [ ! -d "${RESULTS_DIR}" ]; then
    echo "  (no results yet)"
    return
  fi

  for d in "${RESULTS_DIR}"/*/; do
    [ -d "${d}" ] || continue
    local dirname
    dirname="$(basename "${d}")"
    local meta="${d}meta.json"
    if [ -f "${meta}" ]; then
      local ts msg
      ts="$(jq -r '.timestamp // "unknown"' "${meta}")"
      msg="$(jq -r '.commitMessage // ""' "${meta}" | head -c 50)"
      echo "  ${dirname}  ${ts}  ${msg}"
    else
      echo "  ${dirname}"
    fi
  done
}

# ---------------------------------------------------------------------------
# 引数解析
# ---------------------------------------------------------------------------
if [ $# -eq 0 ]; then
  # 引数なし: 直近2つの結果を比較
  if [ ! -d "${RESULTS_DIR}" ]; then
    echo "ERROR: No benchmark results found."
    exit 1
  fi

  # meta.json の timestamp で新しい順にソート
  mapfile -t sorted < <(
    for d in "${RESULTS_DIR}"/*/; do
      [ -d "${d}" ] || continue
      local meta="${d}meta.json"
      if [ -f "${meta}" ]; then
        ts="$(jq -r '.timestamp // "1970-01-01"' "${meta}")"
        echo "${ts} ${d%/}"
      else
        echo "1970-01-01 ${d%/}"
      fi
    done | sort -r | head -2 | awk '{print $2}'
  )

  if [ ${#sorted[@]} -lt 2 ]; then
    echo "ERROR: Need at least 2 benchmark results to compare."
    echo "Available:"
    list_results
    exit 1
  fi

  DIR_A="${sorted[1]}"  # older
  DIR_B="${sorted[0]}"  # newer
elif [ $# -eq 1 ]; then
  # 1引数: 指定 commit と HEAD を比較
  DIR_A="$(resolve_result_dir "$1")"
  CURRENT_HASH="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
  [ -n "$(git status --porcelain 2>/dev/null)" ] && CURRENT_HASH="${CURRENT_HASH}-dirty"
  DIR_B="$(resolve_result_dir "${CURRENT_HASH}")"
else
  # 2引数: 2つの commit を比較
  DIR_A="$(resolve_result_dir "$1")"
  DIR_B="$(resolve_result_dir "$2")"
fi

HASH_A="$(basename "${DIR_A}")"
HASH_B="$(basename "${DIR_B}")"

# ---------------------------------------------------------------------------
# メタ情報表示
# ---------------------------------------------------------------------------
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              Benchmark Diff: ${HASH_A} vs ${HASH_B}"
echo "╠══════════════════════════════════════════════════════════╣"

for label_dir in "Before:${DIR_A}" "After:${DIR_B}"; do
  label="${label_dir%%:*}"
  dir="${label_dir#*:}"
  meta="${dir}/meta.json"
  if [ -f "${meta}" ]; then
    hash="$(jq -r '.commitShort // "?"' "${meta}")"
    msg="$(jq -r '.commitMessage // ""' "${meta}" | head -c 50)"
    ts="$(jq -r '.timestamp // "?"' "${meta}")"
    echo "║  ${label}: ${hash} (${ts})"
    echo "║         ${msg}"
  else
    echo "║  ${label}: $(basename "${dir}")"
  fi
done

echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ---------------------------------------------------------------------------
# レイヤー別比較
# ---------------------------------------------------------------------------
LAYERS=("lighthouse" "api" "db" "frontend")
compared=0

for layer in "${LAYERS[@]}"; do
  summary_a="${DIR_A}/${layer}/summary.json"
  summary_b="${DIR_B}/${layer}/summary.json"

  if [ ! -f "${summary_a}" ] && [ ! -f "${summary_b}" ]; then
    continue
  fi

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ${layer}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if [ ! -f "${summary_a}" ]; then
    echo "  (no ${layer} results for ${HASH_A})"
    echo ""
    continue
  fi
  if [ ! -f "${summary_b}" ]; then
    echo "  (no ${layer} results for ${HASH_B})"
    echo ""
    continue
  fi

  node "${SCRIPT_DIR}/compare.mjs" "${summary_a}" "${summary_b}"
  compared=$((compared + 1))
  echo ""
done

if [ ${compared} -eq 0 ]; then
  echo "No common layers found to compare."
  echo ""
  echo "Available results for ${HASH_A}:"
  ls -1 "${DIR_A}"/ 2>/dev/null | sed 's/^/  /'
  echo ""
  echo "Available results for ${HASH_B}:"
  ls -1 "${DIR_B}"/ 2>/dev/null | sed 's/^/  /'
fi
