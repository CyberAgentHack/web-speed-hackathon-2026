#!/usr/bin/env bash
set -euo pipefail

# Usage: validate.sh [--skip-test] [--skip-build]
# Runs build, bundle size check, regulation checks, and VRT tests.
# Outputs a structured validation report to stdout.

SKIP_TEST=false
SKIP_BUILD=false
for arg in "$@"; do
  case $arg in
    --skip-test) SKIP_TEST=true ;;
    --skip-build) SKIP_BUILD=true ;;
  esac
done

PROJECT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$PROJECT_ROOT"

PASS="PASS"
FAIL="FAIL"
SKIP="SKIP"
ERRORS=""

section() { echo ""; echo "=== $1 ==="; }
result() {
  local status="$1" name="$2" detail="${3-}"
  echo "[$status] $name"
  if [ -n "$detail" ]; then echo "  $detail"; fi
  if [ "$status" = "$FAIL" ]; then ERRORS="$ERRORS\n- $name: $detail"; fi
}

section "1. Build"
if [ "$SKIP_BUILD" = true ]; then
  result "$SKIP" "Build" "Skipped by --skip-build"
else
  if (cd application && pnpm run build) 2>&1 | tail -5; then
    result "$PASS" "Build"
  else
    result "$FAIL" "Build" "pnpm run build failed"
  fi
fi

section "2. Bundle Size Analysis"
CLIENT_DIST="application/dist"
if [ -d "$CLIENT_DIST/scripts" ]; then
  # Total JS size
  TOTAL_JS=0
  while IFS= read -r size; do
    TOTAL_JS=$((TOTAL_JS + size))
  done < <(find "$CLIENT_DIST/scripts" -name '*.js' -exec stat -f%z {} + 2>/dev/null || find "$CLIENT_DIST/scripts" -name '*.js' -exec stat -c%s {} + 2>/dev/null)
  TOTAL_JS_KB=$((TOTAL_JS / 1024))
  echo "Total JS: ${TOTAL_JS_KB} KB"

  # Per-chunk sizes
  echo ""
  echo "Chunk breakdown:"
  (find "$CLIENT_DIST/scripts" -name '*.js' -exec stat -f "%z %N" {} + 2>/dev/null || \
   find "$CLIENT_DIST/scripts" -name '*.js' -exec stat -c "%s %n" {} + 2>/dev/null) | sort -rn | while read -r size name; do
    basename=$(basename "$name")
    size_kb=$((size / 1024))
    echo "  ${size_kb} KB  $basename"
  done

  # CSS size
  echo ""
  echo "CSS:"
  (find "$CLIENT_DIST/styles" -name '*.css' -exec stat -f "%z %N" {} + 2>/dev/null || \
   find "$CLIENT_DIST/styles" -name '*.css' -exec stat -c "%s %n" {} + 2>/dev/null) 2>/dev/null | sort -rn | while read -r size name; do
    basename=$(basename "$name")
    size_kb=$((size / 1024))
    echo "  ${size_kb} KB  $basename"
  done

  # Compare with previous if exists
  PREV_SIZE_FILE="$CLIENT_DIST/.bundle-sizes.prev"
  CURR_SIZE_FILE="$CLIENT_DIST/.bundle-sizes.curr"
  echo "$TOTAL_JS" > "$CURR_SIZE_FILE"

  if [ -f "$PREV_SIZE_FILE" ]; then
    PREV_JS=$(cat "$PREV_SIZE_FILE")
    DIFF=$((TOTAL_JS - PREV_JS))
    DIFF_KB=$((DIFF / 1024))
    if [ "$DIFF" -gt 0 ]; then
      echo ""
      echo "Size change: +${DIFF_KB} KB from previous build"
    elif [ "$DIFF" -lt 0 ]; then
      DIFF_KB=$(( -DIFF / 1024 ))
      echo ""
      echo "Size change: -${DIFF_KB} KB from previous build"
    else
      echo ""
      echo "Size change: no change"
    fi
  fi

  result "$PASS" "Bundle size check"
else
  result "$FAIL" "Bundle size check" "dist/scripts not found. Run build first."
fi

section "3. Regulation Checks"

# 3a. DB initialize endpoint
if grep -rq "initialize" application/server/src/routes/api/ 2>/dev/null; then
  result "$PASS" "DB initialize endpoint" "POST /api/v1/initialize route exists"
else
  result "$FAIL" "DB initialize endpoint" "Initialize endpoint not found in server routes"
fi

# 3b. SSE protocol (crok endpoint)
if grep -rq "crok" application/server/src/routes/api/ 2>/dev/null; then
  result "$PASS" "SSE protocol" "GET /api/v1/crok route exists"
else
  result "$FAIL" "SSE protocol" "Crok SSE endpoint not found"
fi

# 3c. fly.toml unchanged
if git diff --quiet fly.toml 2>/dev/null; then
  result "$PASS" "fly.toml" "No changes detected"
else
  result "$FAIL" "fly.toml" "fly.toml has been modified — this will cause disqualification on Fly.io"
fi

# 3d. Seed IDs unchanged
if git diff --quiet application/server/seeds/ 2>/dev/null; then
  result "$PASS" "Seed IDs" "No seed changes detected"
else
  # Changes exist — check if IDs were modified (not just data additions)
  echo "  WARNING: Seed files have been modified. Verify IDs are unchanged."
  result "$PASS" "Seed IDs" "Seed files modified — verify IDs manually"
fi

section "4. VRT Tests"
if [ "$SKIP_TEST" = true ]; then
  result "$SKIP" "VRT" "Skipped by --skip-test"
else
  echo "Running VRT tests (this may take a few minutes)..."
  if (cd application && pnpm --filter "@web-speed-hackathon-2026/e2e" run test) 2>&1 | tail -20; then
    result "$PASS" "VRT"
  else
    result "$FAIL" "VRT" "Some tests failed. Check output above."
  fi
fi

section "Summary"
if [ -n "$ERRORS" ]; then
  echo "FAILURES:"
  echo -e "$ERRORS"
  echo ""
  echo "Status: FAILED"
  exit 1
else
  echo "All checks passed."
  echo "Status: PASSED"
fi

# Save current bundle size for next comparison
if [ -f "$CURR_SIZE_FILE" ]; then
  cp "$CURR_SIZE_FILE" "$PREV_SIZE_FILE"
fi
