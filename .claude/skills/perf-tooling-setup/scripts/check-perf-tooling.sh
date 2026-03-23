#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-.}"

echo "== perf tooling check =="

check_file() {
  local file="$1"
  if [ -f "$ROOT_DIR/$file" ]; then
    echo "[OK] $file"
  else
    echo "[MISS] $file"
  fi
}

check_text() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  if [ -f "$ROOT_DIR/$file" ] && grep -q "$pattern" "$ROOT_DIR/$file"; then
    echo "[OK] $label"
  else
    echo "[MISS] $label"
  fi
}

# MCP configuration
check_file ".mcp.json"
check_text ".mcp.json" "chrome-devtools" ".mcp.json has chrome-devtools MCP"

# scoring-tool
check_file "scoring-tool/package.json"
if [ -d "$ROOT_DIR/scoring-tool/node_modules" ]; then
  echo "[OK] scoring-tool dependencies installed"
else
  echo "[MISS] scoring-tool dependencies not installed (run: cd scoring-tool && pnpm install)"
fi

# Lighthouse CLI
if command -v npx &> /dev/null && npx lighthouse --version &> /dev/null; then
  echo "[OK] Lighthouse CLI available via npx"
else
  echo "[MISS] Lighthouse CLI not available"
fi

# Application build
if [ -d "$ROOT_DIR/application/dist" ]; then
  echo "[OK] Application build output exists"
else
  echo "[MISS] Application not built (run: cd application && pnpm run build)"
fi

# Application dependencies
if [ -d "$ROOT_DIR/application/node_modules" ]; then
  echo "[OK] Application dependencies installed"
else
  echo "[MISS] Application dependencies not installed (run: cd application && pnpm install)"
fi

# Playwright for VRT
if [ -f "$ROOT_DIR/application/e2e/package.json" ]; then
  echo "[OK] E2E/VRT package exists"
else
  echo "[MISS] E2E package not found"
fi

echo "== done =="
