#!/bin/bash

BASE_URL=${1:-http://127.0.0.1:3000}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="lighthouse-reports/${TIMESTAMP}"
NPX="/Users/mitsunagahiroka/.nvm/versions/node/v22.12.0/bin/npx"

mkdir -p "$OUTPUT_DIR"

# サインインしてセッションCookieを取得
COOKIE_JAR=$(mktemp)
curl -s -c "$COOKIE_JAR" -X POST "${BASE_URL}/api/v1/signin" \
  -H "Content-Type: application/json" \
  -d '{"username": "o6yq16leo", "password": "wsh-2026"}' > /dev/null
SESSION_COOKIE=$(awk '/connect\.sid/ {print "connect.sid=" $7}' "$COOKIE_JAR")
echo "セッションCookie取得: ${SESSION_COOKIE:0:30}..."
echo ""

run_lighthouse() {
  local key="$1"
  local label="$2"
  local path="$3"
  local url="${BASE_URL}${path}"
  local output="${OUTPUT_DIR}/${key}.html"

  echo "========== ${label} =========="
  echo "URL: ${url}"
  "$NPX" lighthouse "$url" \
    --output html \
    --output-path "$output" \
    --chrome-flags="--headless --no-sandbox" \
    --quiet
  echo "レポート: ${output}"
  echo ""
}

run_lighthouse_authed() {
  local key="$1"
  local label="$2"
  local path="$3"
  local url="${BASE_URL}${path}"
  local output="${OUTPUT_DIR}/${key}.html"

  echo "========== ${label} (認証済み) =========="
  echo "URL: ${url}"
  "$NPX" lighthouse "$url" \
    --output html \
    --output-path "$output" \
    --chrome-flags="--headless --no-sandbox" \
    --extra-headers "{\"Cookie\": \"${SESSION_COOKIE}\"}" \
    --quiet
  echo "レポート: ${output}"
  echo ""
}

run_lighthouse "home"        "ホーム"              "/"
run_lighthouse "post"        "投稿詳細"            "/posts/ff93a168-ea7c-4202-9879-672382febfda"
run_lighthouse "post-photo"  "写真つき投稿詳細"    "/posts/fe6712a1-d9e4-4f6a-987d-e7d08b7f8a46"
run_lighthouse "post-video"  "動画つき投稿詳細"    "/posts/fff790f5-99ea-432f-8f79-21d3d49efd1a"
run_lighthouse "post-audio"  "音声つき投稿詳細"    "/posts/fefe75bd-1b7a-478c-8ecc-2c1ab38b821e"
run_lighthouse_authed "dm-list"     "DM一覧"              "/dm"
run_lighthouse_authed "dm-detail"   "DM詳細"              "/dm/33881deb-da8a-4ca9-a153-2f80d5fa7af8"
run_lighthouse "search"      "検索"                "/search"
run_lighthouse "terms"       "利用規約"            "/terms"

rm -f "$COOKIE_JAR"

echo "全レポートを ${OUTPUT_DIR}/ に出力しました"
