TARGET_DIR="./public/movies"

for f in "$TARGET_DIR"/*.gif; do
    basename=$(basename "$f" .gif)
    webm_out="$TARGET_DIR/$basename.webm"
    thumb_out="$TARGET_DIR/${basename}_thumb.webp"

    # 1. メイン：WebM動画 (横640px, VP9, 音声なし)
    ffmpeg -y -i "$f" -c:v libvpx-vp9 -b:v 0 -crf 30 -vf "scale=480:-1" -an "$webm_out"


    echo "$f の変換が完了しました。"
done
