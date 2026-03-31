#!/usr/bin/env bash
set -euo pipefail

SRC_ROOT="${1:-public_legacy/movies}"
DST_ROOT="${2:-public/movies}"
JOBS="${JOBS:-8}"

# Normalize trailing slashes for stable relative path handling.
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

if ! [[ "$JOBS" =~ ^[1-9][0-9]*$ ]]; then
  echo "Error: JOBS must be a positive integer. current=$JOBS" >&2
  exit 1
fi

echo "[mkdir] ensure destination root: $DST_ROOT"
mkdir -p "$DST_ROOT"

processed="$(find "$SRC_ROOT" -type f -iname '*.gif' -print0 | tr -cd '\0' | wc -c | tr -d '[:space:]')"

if [ "$processed" = "0" ]; then
  echo "Done: processed=0 source=$SRC_ROOT destination=$DST_ROOT"
  exit 0
fi

echo "[parallel] jobs=$JOBS files=$processed"

find "$SRC_ROOT" -type f -iname '*.gif' -print0 \
  | xargs -0 -I '{}' -P "$JOBS" bash -c '
      set -euo pipefail
      src="$1"
      src_root="$2"
      dst_root="$3"

      rel="${src#"$src_root"/}"
      dst="$dst_root/$rel"
      dst_dir="$(dirname "$dst")"

      if [ ! -d "$dst_dir" ]; then
        echo "[mkdir] $dst_dir"
        mkdir -p "$dst_dir"
      fi

      echo "[read] $src"
      if [ -f "$dst" ]; then
        echo "[overwrite] $dst"
      else
        echo "[write] $dst"
      fi

      # Resize only when width is greater than 512px while preserving aspect ratio.
      convert "$src" -resize "512x>" "$dst"
    ' _ '{}' "$SRC_ROOT" "$DST_ROOT"

echo "Done: processed=$processed source=$SRC_ROOT destination=$DST_ROOT jobs=$JOBS"