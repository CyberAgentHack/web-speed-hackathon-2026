#!/bin/bash

echo "=== Converting main images to WebP ==="
cd /Users/yukiono/web-speed-hackathon-2026/application/public/images

for jpg in *.jpg; do
  if [ -f "$jpg" ]; then
    base="${jpg%.jpg}"
    echo "Converting $jpg..."
    cwebp -q 80 "$jpg" -o "${base}.webp" 2>/dev/null
  fi
done

echo ""
echo "=== Converting profile images to WebP (150x150, q75) ==="
cd /Users/yukiono/web-speed-hackathon-2026/application/public/images/profiles

for jpg in *.jpg; do
  if [ -f "$jpg" ]; then
    base="${jpg%.jpg}"
    echo "Converting $jpg..."
    cwebp -q 75 -resize 150 150 "$jpg" -o "${base}.webp" 2>/dev/null
  fi
done

echo ""
echo "=== Conversion Complete ==="
cd /Users/yukiono/web-speed-hackathon-2026/application/public/images
echo "Main images JPG: $(du -ch *.jpg 2>/dev/null | tail -1)"
echo "Main images WebP: $(du -ch *.webp 2>/dev/null | tail -1)"
cd profiles
echo "Profile JPG: $(du -ch *.jpg 2>/dev/null | tail -1)"
echo "Profile WebP: $(du -ch *.webp 2>/dev/null | tail -1)"
