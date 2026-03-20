#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# list.sh — 計測済みベンチマーク結果の一覧表示
#
# Usage:
#   ./bench/list.sh
# =============================================================================

RESULTS_DIR="bench-results"

if [ ! -d "${RESULTS_DIR}" ]; then
  echo "No benchmark results yet."
  echo "Run: ./bench/run-all.sh"
  exit 0
fi

echo "Commit       Timestamp                    Layers              Message"
echo "───────────  ───────────────────────────  ──────────────────  ──────────────────────────────"

for d in "${RESULTS_DIR}"/*/; do
  [ -d "${d}" ] || continue
  dirname="$(basename "${d}")"
  meta="${d}meta.json"

  # レイヤー検出
  layers=""
  for layer in lighthouse api db frontend; do
    if [ -d "${d}${layer}" ]; then
      layers="${layers}${layer} "
    fi
  done
  layers="${layers:-(none)}"

  if [ -f "${meta}" ]; then
    ts="$(jq -r '.timestamp // "?"' "${meta}" | cut -c1-25)"
    msg="$(jq -r '.commitMessage // ""' "${meta}" | head -c 30)"
    printf "%-12s %-28s %-20s %s\n" "${dirname}" "${ts}" "${layers}" "${msg}"
  else
    printf "%-12s %-28s %-20s %s\n" "${dirname}" "?" "${layers}" ""
  fi
done | sort -k2 -r
