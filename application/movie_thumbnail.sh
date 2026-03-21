TARGET_DIR="./public/movies"

for f in "$TARGET_DIR"/*.gif; do
    basename=$(basename "$f" .gif)
    webm_out="$TARGET_DIR/$basename.webm"
    thumb_out="$TARGET_DIR/${basename}_thumb.webp"

    # 2. サムネイル：WebP画像 (正方形320x320px)
    ffmpeg -y -i "$f" -vcodec libwebp -vf "crop='min(iw,ih):min(iw,ih)',scale=320:320" -frames:v 1 -q:v 75 "$thumb_out"

    echo "$f の変換が完了しました。"
done
