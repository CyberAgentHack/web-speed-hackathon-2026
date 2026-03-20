#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOVIES_DIR="$SCRIPT_DIR/../public/movies"

gifs=("$MOVIES_DIR"/*.gif)

if [ ${#gifs[@]} -eq 0 ]; then
  echo "No GIF files found in $MOVIES_DIR"
  exit 0
fi

echo "Converting ${#gifs[@]} GIF files to MP4..."

for f in "${gifs[@]}"; do
  base="$(basename "$f" .gif)"
  out="$MOVIES_DIR/$base.mp4"
  ffmpeg -y -i "$f" -movflags +faststart -pix_fmt yuv420p -an "$out" 2>/dev/null
  echo "  $base.gif -> $base.mp4"
done

echo "Done!"
