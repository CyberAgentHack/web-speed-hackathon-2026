#!/bin/bash
cd /Users/yukiono/web-speed-hackathon-2026/application/public/movies

for gif in *.gif; do
  base="${gif%.gif}"
  echo "Converting $gif to WebM..."
  ffmpeg -y -i "$gif" -c:v libvpx-vp9 -crf 30 -b:v 0 -an -pix_fmt yuv420p "${base}.webm" 2>/dev/null
done

echo "=== Conversion Complete ==="
echo "GIF total: $(du -ch *.gif | tail -1)"
echo "WebM total: $(du -ch *.webm | tail -1)"
echo "MP4 total: $(du -ch *.mp4 | tail -1)"
