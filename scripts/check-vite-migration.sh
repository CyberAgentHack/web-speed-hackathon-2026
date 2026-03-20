#!/usr/bin/env bash
# Vite 8 (Rolldown) 移行後のリスクチェックスクリプト
# 機械的に検証可能な項目をすべてチェックする
set -euo pipefail

DIST_DIR="application/dist"
CLIENT_DIR="application/client"
NM_DIR="$CLIENT_DIR/node_modules"
ERRORS=0
WARNINGS=0

pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; ERRORS=$((ERRORS + 1)); }
warn() { echo "  ⚠️  $1"; WARNINGS=$((WARNINGS + 1)); }

echo "=== Vite Migration Risk Check ==="
echo ""

# --- 1. ビルド成果物の存在確認 ---
echo "1. ビルド成果物"
if [ -f "$DIST_DIR/index.html" ]; then
  pass "index.html exists"
else
  fail "index.html missing in $DIST_DIR"
fi

JS_COUNT=$(find "$DIST_DIR/scripts" -name "*.js" 2>/dev/null | wc -l)
if [ "$JS_COUNT" -gt 0 ]; then
  pass "JS bundles: $JS_COUNT files"
else
  fail "No JS bundles found in $DIST_DIR/scripts/"
fi

CSS_COUNT=$(fd '\.css$' "$DIST_DIR" 2>/dev/null | wc -l)
if [ "$CSS_COUNT" -gt 0 ]; then
  pass "CSS files: $CSS_COUNT files"
else
  fail "No CSS files found"
fi

# --- 2. KaTeX フォント ---
echo ""
echo "2. KaTeX フォント"
KATEX_FONTS=$(find "$DIST_DIR" -name "KaTeX_*" 2>/dev/null | wc -l)
if [ "$KATEX_FONTS" -gt 0 ]; then
  pass "KaTeX fonts found: $KATEX_FONTS files"
else
  fail "KaTeX fonts missing — CSS @font-face will fail"
fi

# index.html 内の CSS に katex スタイルが含まれるか確認
if grep -q "katex" "$DIST_DIR/index.html" 2>/dev/null || fd '\.css$' "$DIST_DIR" -x grep -l "KaTeX" {} 2>/dev/null | head -1 | grep -q . || grep -rl '\.katex' "$DIST_DIR" 2>/dev/null | head -1 | grep -q .; then
  pass "KaTeX CSS reference found in build output"
else
  warn "KaTeX CSS reference not found — check if katex.min.css is imported"
fi

# --- 3. kuromoji (CJS) 互換性 ---
echo ""
echo "3. kuromoji (CJS module)"
if find "$DIST_DIR/scripts" -name "*.js" -exec grep -l "kuromoji" {} \; 2>/dev/null | head -1 | grep -q .; then
  pass "kuromoji referenced in build output"
else
  warn "kuromoji not found in build output — may be dynamically imported (OK if lazy loaded)"
fi

KUROMOJI_BUILD="$NM_DIR/kuromoji/build/kuromoji.js"
if [ -f "$KUROMOJI_BUILD" ]; then
  pass "kuromoji/build/kuromoji.js exists at alias target"
else
  fail "kuromoji alias target missing: $KUROMOJI_BUILD"
fi

# --- 4. @ffmpeg/core (UMD) ---
echo ""
echo "4. @ffmpeg/core (UMD WASM)"
FFMPEG_CORE_JS="$NM_DIR/@ffmpeg/core/dist/umd/ffmpeg-core.js"
FFMPEG_CORE_WASM="$NM_DIR/@ffmpeg/core/dist/umd/ffmpeg-core.wasm"
if [ -f "$FFMPEG_CORE_JS" ]; then
  pass "ffmpeg-core.js exists"
else
  fail "ffmpeg-core.js missing: $FFMPEG_CORE_JS"
fi
if [ -f "$FFMPEG_CORE_WASM" ]; then
  pass "ffmpeg-core.wasm exists"
else
  fail "ffmpeg-core.wasm missing: $FFMPEG_CORE_WASM"
fi

# ?binary import が残っていないことを確認
if grep -r '?binary' "$CLIENT_DIR/src/" 2>/dev/null | grep -v node_modules; then
  fail "?binary imports still exist (should be replaced with ?url or URL patterns)"
else
  pass "No ?binary imports remaining"
fi

# --- 5. @imagemagick/magick-wasm ---
echo ""
echo "5. @imagemagick/magick-wasm"
MAGICK_WASM="$NM_DIR/@imagemagick/magick-wasm/dist/magick.wasm"
if [ -f "$MAGICK_WASM" ]; then
  pass "magick.wasm exists: $(du -h "$MAGICK_WASM" | cut -f1)"
else
  fail "magick.wasm missing: $MAGICK_WASM"
fi

# --- 6. negaposi-analyzer-ja 辞書 ---
echo ""
echo "6. negaposi-analyzer-ja dictionary"
NEGAPOSI_DICT="$NM_DIR/negaposi-analyzer-ja/dict/pn_ja.dic.json"
if [ -f "$NEGAPOSI_DICT" ]; then
  DICT_SIZE=$(wc -c < "$NEGAPOSI_DICT")
  if [ "$DICT_SIZE" -gt 1000 ]; then
    pass "pn_ja.dic.json exists ($DICT_SIZE bytes)"
  else
    fail "pn_ja.dic.json exists but too small ($DICT_SIZE bytes) — may be corrupted"
  fi
else
  fail "pn_ja.dic.json missing — run: cd $NM_DIR/negaposi-analyzer-ja && node bin/download-negaposi-dict.js"
fi

# --- 7. Rolldown 互換性 (webpack 固有パターンの残存) ---
echo ""
echo "7. webpack 残存チェック"
if [ -f "$CLIENT_DIR/webpack.config.js" ]; then
  warn "webpack.config.js still exists (should be removed)"
else
  pass "webpack.config.js removed"
fi

if [ -f "$CLIENT_DIR/babel.config.js" ]; then
  warn "babel.config.js still exists (Vite uses esbuild/SWC)"
else
  pass "babel.config.js removed"
fi

if grep -r '__webpack_' "$CLIENT_DIR/src/" 2>/dev/null | grep -v node_modules; then
  fail "__webpack_ references found in source"
else
  pass "No __webpack_ references"
fi

# --- 8. index.html エントリ ---
echo ""
echo "8. index.html entry point"
if grep -q 'type="module"' "$CLIENT_DIR/src/index.html" 2>/dev/null; then
  pass "script type=\"module\" found in index.html"
else
  fail "script type=\"module\" missing in index.html"
fi

# --- 9. バンドルサイズ ---
echo ""
echo "9. Bundle size check"
ENTRY_JS=$(find "$DIST_DIR/scripts" -name "index.*.js" -o -name "main.*.js" 2>/dev/null | head -1)
if [ -n "$ENTRY_JS" ]; then
  ENTRY_SIZE=$(du -k "$ENTRY_JS" | cut -f1)
  if [ "$ENTRY_SIZE" -lt 2048 ]; then
    pass "Entry bundle: ${ENTRY_SIZE}KB (< 2MB threshold)"
  else
    warn "Entry bundle: ${ENTRY_SIZE}KB (> 2MB — consider more code splitting)"
  fi
else
  warn "Could not find entry JS bundle"
fi

TOTAL_JS_SIZE=$(find "$DIST_DIR/scripts" -name "*.js" -exec du -k {} + 2>/dev/null | awk '{sum+=$1} END {print sum}')
echo "  📊 Total JS size: ${TOTAL_JS_SIZE}KB"

# --- 10. ProvidePlugin globals ---
echo ""
echo "10. Global injection (ProvidePlugin replacements)"
# Check files that use 'new AudioContext()' but don't import it
AUDIO_FILES=$(grep -rln 'new AudioContext()' "$CLIENT_DIR/src/" 2>/dev/null | grep -v node_modules)
AUDIO_BARE=0
for f in $AUDIO_FILES; do
  if ! grep -q 'from "standardized-audio-context"' "$f" 2>/dev/null; then
    echo "  $f uses AudioContext without import"
    AUDIO_BARE=1
  fi
done
if [ "$AUDIO_BARE" -eq 1 ]; then
  warn "Bare 'new AudioContext()' found without explicit import — may fail without ProvidePlugin"
else
  pass "AudioContext properly imported or not used bare"
fi

# --- Summary ---
echo ""
echo "=== Summary ==="
echo "  Errors:   $ERRORS"
echo "  Warnings: $WARNINGS"
if [ "$ERRORS" -gt 0 ]; then
  echo "  ❌ FAIL — fix errors before proceeding"
  exit 1
else
  echo "  ✅ PASS"
  exit 0
fi
