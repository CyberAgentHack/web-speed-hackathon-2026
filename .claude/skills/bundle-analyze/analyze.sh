#!/usr/bin/env bash
set -euo pipefail

# Usage: analyze.sh [--rebuild] [--top N]
# Analyzes Webpack bundle output: chunk sizes, dependency breakdown, optimization state.
# Requires build output in application/dist/

REBUILD=false
TOP=20
for arg in "$@"; do
  case $arg in
    --rebuild) REBUILD=true ;;
    --top) shift; TOP="${1:-20}" ;;
    --top=*) TOP="${arg#*=}" ;;
  esac
done

PROJECT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$PROJECT_ROOT"

CLIENT_DIST="application/dist"

if [ "$REBUILD" = true ]; then
  echo "Rebuilding..."
  (cd application && pnpm run build) 2>&1 | tail -3
fi

section() { echo ""; echo "=== $1 ==="; }

section "1. Overall Bundle Size"

if [ ! -d "$CLIENT_DIST/scripts" ]; then
  echo "ERROR: $CLIENT_DIST/scripts not found. Run 'cd application && pnpm run build' first."
  exit 1
fi

echo ""
echo "JavaScript chunks (sorted by size):"
(find "$CLIENT_DIST/scripts" -name '*.js' -exec stat -f "%z %N" {} + 2>/dev/null || \
 find "$CLIENT_DIST/scripts" -name '*.js' -exec stat -c "%s %n" {} + 2>/dev/null) | sort -rn | while read -r size name; do
  basename=$(basename "$name")
  size_kb=$((size / 1024))
  # Gzip estimate (~30-40% of original for JS)
  gzip_kb=$((size_kb * 35 / 100))
  echo "  ${size_kb} KB (gzip ~${gzip_kb} KB)  $basename"
done

echo ""
echo "CSS files:"
(find "$CLIENT_DIST/styles" -name '*.css' -exec stat -f "%z %N" {} + 2>/dev/null || \
 find "$CLIENT_DIST/styles" -name '*.css' -exec stat -c "%s %n" {} + 2>/dev/null) 2>/dev/null | sort -rn | while read -r size name; do
  basename=$(basename "$name")
  size_kb=$((size / 1024))
  echo "  ${size_kb} KB  $basename"
done

section "2. Webpack Configuration Analysis"

echo ""
echo "Checking webpack.config.js optimization state:"
WEBPACK_CONFIG="application/client/webpack.config.js"
if [ -f "$WEBPACK_CONFIG" ]; then
  check_setting() {
    local setting="$1" expected="$2"
    if grep -q "$setting" "$WEBPACK_CONFIG"; then
      local value
      value=$(grep "$setting" "$WEBPACK_CONFIG" | head -1 | sed 's/.*: *//' | sed 's/,$//')
      if echo "$value" | grep -q "$expected"; then
        echo "  [OK] $setting: $value"
      else
        echo "  [WARN] $setting: $value (recommended: $expected)"
      fi
    else
      echo "  [MISS] $setting not found"
    fi
  }

  check_setting "minimize" "true"
  check_setting "splitChunks" "true\|chunks"
  check_setting "concatenateModules" "true"
  check_setting "usedExports" "true"
  check_setting "sideEffects" "true"

  # Check mode
  if grep -q "mode:" "$WEBPACK_CONFIG"; then
    MODE=$(grep "mode:" "$WEBPACK_CONFIG" | head -1 | sed 's/.*: *//' | sed 's/[",]//g' | tr -d ' ')
    if [ "$MODE" = "production" ]; then
      echo "  [OK] mode: production"
    else
      echo "  [WARN] mode: $MODE (recommended: production)"
    fi
  fi

  # Check devtool
  if grep -q "devtool:" "$WEBPACK_CONFIG"; then
    DEVTOOL=$(grep "devtool:" "$WEBPACK_CONFIG" | head -1 | sed 's/.*: *//' | sed 's/[",]//g' | tr -d ' ')
    if [ "$DEVTOOL" = "false" ] || [ "$DEVTOOL" = "source-map" ]; then
      echo "  [OK] devtool: $DEVTOOL"
    else
      echo "  [WARN] devtool: $DEVTOOL (inline-source-map doubles bundle size)"
    fi
  fi

  # Check cache
  if grep -q "cache:" "$WEBPACK_CONFIG"; then
    CACHE=$(grep "cache:" "$WEBPACK_CONFIG" | head -1 | sed 's/.*: *//' | sed 's/[",]//g' | tr -d ' ')
    if [ "$CACHE" = "false" ]; then
      echo "  [WARN] cache: false (builds will be slower)"
    else
      echo "  [OK] cache: $CACHE"
    fi
  fi
else
  echo "  webpack.config.js not found at $WEBPACK_CONFIG"
fi

echo ""
echo "Checking babel.config.js:"
BABEL_CONFIG="application/client/babel.config.js"
if [ -f "$BABEL_CONFIG" ]; then
  if grep -q "ie 11" "$BABEL_CONFIG"; then
    echo "  [WARN] Babel targets IE 11 — generates unnecessary polyfill code for modern browsers"
  else
    echo "  [OK] Babel does not target IE 11"
  fi
fi

section "3. Dependency Analysis (heavy libraries in bundle)"

echo ""
echo "Top $TOP largest dependencies found in main JS chunks:"
echo ""

node -e "
const fs = require('fs');
const path = require('path');

const distDir = '$CLIENT_DIST/scripts';
if (!fs.existsSync(distDir)) {
  console.log('  scripts directory not found.');
  process.exit(0);
}
const jsFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));

// Known heavy dependencies to check for
const heavyDeps = [
  'core-js', 'regenerator-runtime',
  'jquery', 'lodash', 'moment', 'bluebird',
  'ffmpeg', 'magick-wasm', 'imagemagick',
  'web-llm', 'mlc-ai',
  'kuromoji', 'negaposi',
  'bayesian-bm25',
  'react-syntax-highlighter', 'katex', 'rehype-katex',
  'standardized-audio-context',
  'react-dom', 'react-router', 'redux',
  'encoding-japanese', 'piexifjs',
  'pako', 'buffer',
  'tailwindcss',
];

const results = {};
for (const jsFile of jsFiles) {
  const content = fs.readFileSync(path.join(distDir, jsFile), 'utf8');
  for (const dep of heavyDeps) {
    const escaped = dep.replace(/[.*+?\${}()|[\\]\\\\]/g, '\\\\$&');
    const regex = new RegExp(escaped, 'g');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      if (!results[dep]) results[dep] = [];
      results[dep].push({ file: jsFile, refs: matches.length });
    }
  }
}

const sorted = Object.entries(results)
  .map(([dep, files]) => ({ dep, files, totalRefs: files.reduce((s, f) => s + f.refs, 0) }))
  .sort((a, b) => b.totalRefs - a.totalRefs)
  .slice(0, $TOP);

for (const { dep, files } of sorted) {
  const chunks = files.map(f => f.file).join(', ');
  console.log('  ' + dep + ' -> found in: ' + chunks);
}

if (sorted.length === 0) {
  console.log('  No known heavy dependencies detected in bundle.');
}
"

section "4. Entry Point Analysis"

echo ""
echo "Webpack entry configuration:"
if [ -f "$WEBPACK_CONFIG" ]; then
  node -e "
const fs = require('fs');
const content = fs.readFileSync('$WEBPACK_CONFIG', 'utf8');

// Extract entry section
const entryMatch = content.match(/entry:\s*\{[\s\S]*?\n\s*\}/);
if (entryMatch) {
  console.log('  ' + entryMatch[0].replace(/\n/g, '\n  '));
} else {
  console.log('  Could not parse entry configuration');
}

// Check ProvidePlugin
if (content.includes('ProvidePlugin')) {
  console.log('');
  console.log('  ProvidePlugin globals:');
  const provideMatch = content.match(/ProvidePlugin\(\{[\s\S]*?\}\)/);
  if (provideMatch) {
    console.log('    ' + provideMatch[0].replace(/\n/g, '\n    '));
  }
}
"
fi

section "5. Optimization Opportunities"

echo ""
node -e "
const fs = require('fs');
const path = require('path');

const distDir = '$CLIENT_DIST/scripts';
if (!fs.existsSync(distDir)) {
  console.log('  scripts directory not found.');
  process.exit(0);
}
const jsFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));

const issues = [];

for (const jsFile of jsFiles) {
  const filePath = path.join(distDir, jsFile);
  const size = fs.statSync(filePath).size;
  const sizeKB = Math.round(size / 1024);

  // Flag chunks > 500KB
  if (size > 500 * 1024) {
    issues.push({
      severity: size > 2000 * 1024 ? 'CRITICAL' : 'WARNING',
      message: jsFile + ' is ' + sizeKB + ' KB — consider code splitting',
    });
  }

  // Check for unminified code patterns
  const content = fs.readFileSync(filePath, 'utf8').slice(0, 10000);
  if (content.includes('  function ') || content.includes('  var ') || content.includes('  const ')) {
    const indentedLines = content.split('\n').filter(l => l.startsWith('  ')).length;
    if (indentedLines > 20) {
      issues.push({
        severity: 'WARNING',
        message: jsFile + ' appears to contain unminified code',
      });
    }
  }

  // Check for inline source maps
  if (fs.readFileSync(filePath, 'utf8').includes('sourceMappingURL=data:')) {
    issues.push({
      severity: 'CRITICAL',
      message: jsFile + ' contains inline source map — doubles bundle size',
    });
  }
}

// Check total JS size
const totalSize = jsFiles.reduce((sum, f) => sum + fs.statSync(path.join(distDir, f)).size, 0);
const totalKB = Math.round(totalSize / 1024);
if (totalSize > 5000 * 1024) {
  issues.push({
    severity: 'CRITICAL',
    message: 'Total JS bundle is ' + totalKB + ' KB (' + Math.round(totalKB / 1024) + ' MB) — major optimization needed',
  });
}

// Check for Tailwind CDN in HTML
const htmlPath = '$CLIENT_DIST/index.html';
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  if (html.includes('tailwindcss/browser') || html.includes('cdn.jsdelivr.net/npm/@tailwindcss')) {
    issues.push({
      severity: 'CRITICAL',
      message: 'Tailwind CSS loaded from CDN — runtime compilation blocks rendering',
    });
  }
}

if (issues.length === 0) {
  console.log('  No major optimization issues detected.');
} else {
  for (const issue of issues.sort((a, b) => (a.severity === 'CRITICAL' ? -1 : 1))) {
    console.log('  [' + issue.severity + '] ' + issue.message);
  }
}
"

echo ""
echo "=== Analysis Complete ==="
