#!/usr/bin/env bash
set -euo pipefail

SRC_ROOT="${1:-public_legacy/images}"
DST_ROOT="${2:-public/images}"

# Normalize trailing slashes to keep relative path handling stable.
SRC_ROOT="${SRC_ROOT%/}"
DST_ROOT="${DST_ROOT%/}"

if ! command -v convert >/dev/null 2>&1; then
  echo "Error: convert command is not available." >&2
  exit 1
fi

if [ ! -d "$SRC_ROOT" ]; then
  echo "Error: source directory not found: $SRC_ROOT" >&2
  exit 1
fi

mkdir -p "$DST_ROOT"

processed=0
removed=0

while IFS= read -r -d '' src; do
  rel="${src#"$SRC_ROOT"/}"
  rel_no_ext="${rel%.*}"
  dst="$DST_ROOT/$rel_no_ext.jpeg"
  base_no_ext="$DST_ROOT/$rel_no_ext"

  mkdir -p "$(dirname "$dst")"

  echo "[read] $src"
  echo "[write] $dst"

  # Remove existing files with the same basename regardless of extension.
  while IFS= read -r -d '' existing; do
    echo "[overwrite] remove existing: $existing"
    rm -f "$existing"
    removed=$((removed + 1))
  done < <(find "$DST_ROOT" -type f -path "$base_no_ext.*" -print0)

  # Output as jpeg and shrink only when the image is wider than 512px.
  convert "$src" -resize '512x>' "$dst"

  processed=$((processed + 1))
done < <(find "$SRC_ROOT" -type f \( -iname '*.jpg' -o -iname '*.jpeg' \) -print0)

echo "Done: $processed jpeg files written to $DST_ROOT (removed: $removed)"
