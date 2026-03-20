TARGET_DIR="./public/images/profiles"

for f in "$TARGET_DIR"/*.jpg; do
    # 拡張子を .webp に置換して実行
    ffmpeg -i "$f" -vf "scale=128:-1" -q:v 75 "${f%.jpg}.webp"
done
