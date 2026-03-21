#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOUNDS_DIR="$SCRIPT_DIR/../public/sounds"

mp3s=("$SOUNDS_DIR"/*.mp3)

if [ ${#mp3s[@]} -eq 0 ]; then
  echo "No MP3 files found in $SOUNDS_DIR"
  exit 0
fi

echo "Converting ${#mp3s[@]} MP3 files to WebM (Opus 64k)..."

total_old=0
total_new=0

for f in "${mp3s[@]}"; do
  base="$(basename "$f" .mp3)"
  out="$SOUNDS_DIR/$base.webm"
  old_size=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null)
  ffmpeg -y -i "$f" -c:a libopus -b:a 64k -vn "$out" 2>/dev/null
  new_size=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out" 2>/dev/null)
  total_old=$((total_old + old_size))
  total_new=$((total_new + new_size))
  echo "  $base.mp3 ($(( old_size / 1024 ))KB) -> $base.webm ($(( new_size / 1024 ))KB)"
done

echo ""
echo "Total: $(( total_old / 1024 ))KB -> $(( total_new / 1024 ))KB (saved $(( (total_old - total_new) * 100 / total_old ))%)"
echo ""
echo "To remove original MP3 files: rm $SOUNDS_DIR/*.mp3"
