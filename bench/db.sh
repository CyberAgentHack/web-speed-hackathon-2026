#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# db.sh — SQLite クエリ統計的ベンチマーク
#
# 主要クエリを N 回実行し、実行時間の統計量を算出する。
# EXPLAIN QUERY PLAN でインデックス使用状況も確認。
#
# Usage:
#   ./bench/db.sh [RUNS] [DB_PATH]
#   RUNS     繰り返し回数（デフォルト: 20）
#   DB_PATH  SQLiteファイルパス（デフォルト: application/server/database.sqlite）
# =============================================================================

RUNS="${1:-20}"
DB_PATH="${2:-application/server/database.sqlite}"

if [ -n "${BENCH_OUTDIR:-}" ]; then
  OUTDIR="${BENCH_OUTDIR}/db"
else
  COMMIT_HASH="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
  [ -n "$(git status --porcelain 2>/dev/null)" ] && COMMIT_HASH="${COMMIT_HASH}-dirty"
  OUTDIR="bench-results/${COMMIT_HASH}/db"
fi

mkdir -p "${OUTDIR}"

if [ ! -f "${DB_PATH}" ]; then
  echo "ERROR: Database not found at ${DB_PATH}"
  exit 1
fi

echo "=== DB Benchmark (SQLite) ==="
echo "Runs: ${RUNS} | DB: ${DB_PATH} | Output: ${OUTDIR}"
echo ""

# ---------------------------------------------------------------------------
# 1. インデックス一覧
# ---------------------------------------------------------------------------
echo "── Indexes ──"
sqlite3 "${DB_PATH}" <<'EOF'
.headers on
.mode column
SELECT name, tbl_name FROM sqlite_master WHERE type='index' ORDER BY tbl_name, name;
EOF
echo ""

# ---------------------------------------------------------------------------
# 2. テーブル行数
# ---------------------------------------------------------------------------
echo "── Table Row Counts ──"
for table in Users Posts Comments Images PostsImagesRelations Movies Sounds ProfileImages DirectMessageConversations DirectMessages qa_suggestions; do
  count=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM ${table};" 2>/dev/null || echo "0")
  printf "  %-35s %s\n" "${table}" "${count}"
done
echo ""

# ---------------------------------------------------------------------------
# 3. ベンチマーク対象クエリ
# ---------------------------------------------------------------------------
declare -A QUERIES=(
  # 投稿一覧（ページネーション）
  [posts_list]="SELECT * FROM Posts ORDER BY createdAt DESC LIMIT 20;"

  # 投稿詳細（ID指定）
  [post_by_id]="SELECT * FROM Posts WHERE id = 'ff93a168-ea7c-4202-9879-672382febfda';"

  # ユーザー検索（username指定）
  [user_by_username]="SELECT * FROM Users WHERE username = 'o6yq16leo';"

  # ユーザーの投稿一覧
  [posts_by_user]="SELECT * FROM Posts WHERE userId = (SELECT id FROM Users WHERE username = 'o6yq16leo') ORDER BY createdAt DESC LIMIT 20;"

  # コメント一覧（postId指定）
  [comments_by_post]="SELECT * FROM Comments WHERE postId = 'ff93a168-ea7c-4202-9879-672382febfda' ORDER BY createdAt ASC;"

  # 画像リレーション（postId指定）
  [images_by_post]="SELECT i.* FROM Images i JOIN PostsImagesRelations r ON i.id = r.imageId WHERE r.postId = 'ff93a168-ea7c-4202-9879-672382febfda';"

  # DM一覧（特定ユーザー）
  [dm_conversations]="SELECT * FROM DirectMessageConversations WHERE initiatorId = (SELECT id FROM Users WHERE username = 'o6yq16leo') OR memberId = (SELECT id FROM Users WHERE username = 'o6yq16leo');"

  # DM詳細（conversation指定）
  [dm_messages]="SELECT * FROM DirectMessages WHERE conversationId = '33881deb-da8a-4ca9-a153-2f80d5fa7af8' ORDER BY createdAt ASC;"

  # 検索（LIKE）
  [search_posts]="SELECT * FROM Posts WHERE text LIKE '%test%' LIMIT 20;"

  # 全件カウント
  [count_posts]="SELECT COUNT(*) FROM Posts;"

  # JOIN: 投稿 + ユーザー
  [posts_with_user]="SELECT p.*, u.username, u.name FROM Posts p JOIN Users u ON p.userId = u.id ORDER BY p.createdAt DESC LIMIT 20;"

  # N+1 シミュレーション: 投稿20件 → 各コメント数
  [n_plus_1_comments]="SELECT p.id, (SELECT COUNT(*) FROM Comments c WHERE c.postId = p.id) AS commentCount FROM Posts p ORDER BY p.createdAt DESC LIMIT 20;"
)

# ---------------------------------------------------------------------------
# 4. EXPLAIN QUERY PLAN
# ---------------------------------------------------------------------------
echo "── EXPLAIN QUERY PLAN ──"
for name in "${!QUERIES[@]}"; do
  query="${QUERIES[$name]}"
  echo ""
  echo "  [${name}]"
  sqlite3 "${DB_PATH}" "EXPLAIN QUERY PLAN ${query}" 2>/dev/null | while read -r line; do
    echo "    ${line}"
  done
done
echo ""

# ---------------------------------------------------------------------------
# 5. 計測
# ---------------------------------------------------------------------------
echo "── Benchmark (${RUNS} runs each) ──"

# 結果JSONを初期化
echo "{" > "${OUTDIR}/raw.json"
first_query=true

for name in "${!QUERIES[@]}"; do
  query="${QUERIES[$name]}"
  echo -n "  ${name}... "

  times=()
  for i in $(seq 1 "${RUNS}"); do
    # .timer on を使って計測（real time を取得）
    elapsed=$(sqlite3 "${DB_PATH}" <<EOSQL 2>&1 | grep -oP 'Run Time: real \K[\d.]+'
.timer on
${query}
EOSQL
    )
    # 秒→ミリ秒に変換
    ms=$(echo "${elapsed} * 1000" | bc -l 2>/dev/null || echo "0")
    times+=("${ms}")
  done

  # JSON配列として書き出し
  times_json=$(printf '%s\n' "${times[@]}" | jq -s '.')
  if [ "${first_query}" = true ]; then
    first_query=false
  else
    echo "," >> "${OUTDIR}/raw.json"
  fi
  echo "\"${name}\": ${times_json}" >> "${OUTDIR}/raw.json"

  echo "done"
done

echo "}" >> "${OUTDIR}/raw.json"

echo ""
echo "=== Aggregating ==="
node bench/aggregate-db.mjs "${OUTDIR}"

echo ""
echo "Results saved to: ${OUTDIR}"
echo "Summary: ${OUTDIR}/summary.json"
