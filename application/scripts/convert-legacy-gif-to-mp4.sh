#!/usr/bin/env bash
set -euo pipefail

SRC_ROOT="${1:-public_legacy/movies}"
DST_ROOT="${2:-public/movies}"
JOBS="${JOBS:-8}"

# Normalize trailing slashes for stable relative path handling.
SRC_ROOT="${SRC_ROOT%/}"
DST_ROOT="${DST_ROOT%/}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Error: ffmpeg command is not available." >&2
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
      rel_no_ext="${rel%.*}"
      base_no_ext="$dst_root/$rel_no_ext"
      dst="$dst_root/$rel_no_ext.mp4"
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

      # Remove existing files with the same basename regardless of extension.
      while IFS= read -r -d "" existing; do
        echo "[overwrite] remove existing: $existing"
        rm -f "$existing"
      done < <(find "$dst_root" -type f -path "$base_no_ext.*" -print0)

      # Chrome-friendly H.264 MP4 output with even dimensions and faststart.
      ffmpeg -hide_banner -loglevel error -y -i "$src" \
        -movflags +faststart \
        -pix_fmt yuv420p \
        -vf "scale=512:trunc(ih*512/iw/2)*2" \
        "$dst"
    ' _ '{}' "$SRC_ROOT" "$DST_ROOT"

echo "Done: processed=$processed source=$SRC_ROOT destination=$DST_ROOT jobs=$JOBS"