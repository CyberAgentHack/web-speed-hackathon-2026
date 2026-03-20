#!/bin/bash

# ==========================================
# 計測＆自動ログ保存スクリプト
# 使い方: ./measure.sh [-l|--local] [番号 or ターゲット名 or list]
# 例1: ./measure.sh 1             # デプロイ先で「ホームを開く」を計測
# 例2: ./measure.sh -l 14         # ローカルで「ユーザーフロー: 投稿」を計測
# 例3: ./measure.sh list          # 番号と計測名の一覧を確認する
# ==========================================

# 1. ターゲットの配列（インデックス1から開始）
TARGETS=(
    "all" # 0番目は全体テスト用として扱う
    "ホームを開く"
    "投稿詳細ページを開く"
    "写真つき投稿詳細ページを開く"
    "動画つき投稿詳細ページを開く"
    "音声つき投稿詳細ページを開く"
    "検索ページを開く"
    "DM一覧ページを開く"
    "DM詳細ページを開く"
    "利用規約ページを開く"
    "ユーザーフロー: ユーザー登録 → サインアウト → サインイン"
    "ユーザーフロー: DM送信"
    "ユーザーフロー: 検索 → 結果表示"
    "ユーザーフロー: Crok AIチャット"
    "ユーザーフロー: 投稿"
)

# 2. デフォルト設定
APP_URL="https://pr-6-web-speed-hackathon-2026.fly.dev/"
ENV_NAME="remote"
INPUT=""

# 3. 引数の解析
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -l|--local)
            APP_URL="http://localhost:3000"
            ENV_NAME="local"
            shift
            ;;
        *)
            INPUT=$1
            shift
            ;;
    esac
done

# 4. listコマンドが入力された場合は一覧を表示して終了
if [ "$INPUT" = "list" ]; then
    echo "📊 計測名と指定番号の一覧"
    echo "----------------------------------------"
    for i in "${!TARGETS[@]}"; do
        if [ "$i" -ne 0 ]; then
            # 番号を右揃えで見やすくフォーマット
            printf " %2d : %s\n" "$i" "${TARGETS[$i]}"
        fi
    done
    echo "----------------------------------------"
    exit 0
fi

# 5. 入力が数字かどうか判定してターゲット名を決定
if [[ "$INPUT" =~ ^[0-9]+$ ]] && [ "$INPUT" -ge 1 ] && [ "$INPUT" -le 14 ]; then
    TARGET="${TARGETS[$INPUT]}"
elif [ -n "$INPUT" ]; then
    TARGET="$INPUT"
else
    TARGET="all"
fi

# 6. ログの保存先ディレクトリ
LOG_DIR="/Users/OCUST013/Develop/Projects/web-speed-hackathon-2026/logs"

# 7. 最新コミット番号とバージョン計算
COMMIT=$(git rev-parse --short HEAD)
COUNT=$(ls "$LOG_DIR"/"$TARGET"_"${ENV_NAME}"_"$COMMIT"_v*.log 2>/dev/null | wc -l | awk '{print $1}')
VERSION=$((COUNT + 1))

# 8. 実行時間とファイル名
TIME=$(date +%Y%m%d_%H%M%S)
# スラッシュやスペースがファイル名に入ると不具合が起きるため、ログファイル名用に安全な文字列に変換
SAFE_TARGET=$(echo "$TARGET" | sed -e 's/[ /→:]/_/g')
LOG_FILE="$LOG_DIR/${SAFE_TARGET}_${ENV_NAME}_${COMMIT}_v${VERSION}_${TIME}.log"

echo "🚀 計測を開始します..."
echo "🌍 環境: $ENV_NAME ($APP_URL)"
echo "🎯 ターゲット: $TARGET"
echo "📂 ログ出力先: $LOG_FILE"
echo "----------------------------------------"

# 9. 実行とログ保存
if [ "$TARGET" = "all" ]; then
    pnpm start --dir scoring-tool --applicationUrl "$APP_URL" 2>&1 | tee "$LOG_FILE"
else
    pnpm start --dir scoring-tool --applicationUrl "$APP_URL" --targetName "$TARGET" 2>&1 | tee "$LOG_FILE"
fi

echo "----------------------------------------"
echo "✅ 計測が完了し、ログが保存されました。"