# ユーザーフロー計測失敗の修正 + Dockerfile 最適化

## 変更内容

### ユーザーフロー修正

#### 検索 — クエリ入力失敗
- `SearchPage.tsx` の `<input>` に `aria-label` を追加
- スコアリングツールは `getByRole("textbox", { name: "検索 (例: ...)" })` で要素を探すが、`placeholder` だけでは accessible name にならず見つからなかった

#### 画像投稿 — 完了確認失敗
- `image.ts` (POST /api/v1/images) で EXIF から alt を読み取り、Image DBレコードを作成するように修正
- 元のコードはファイル保存のみで Image レコードを作らず、alt が空になっていた
- スコアリングツールは `getByAltText("熊の形をした...")` で投稿画像を探すが、alt="" のため見つからずタイムアウト

### DM詳細 — ResizeObserver 置換（前回 11 の内容）
- `DirectMessagePage.tsx` の 1ms setInterval → ResizeObserver に置換済み

### Dockerfile 最適化
- `COPY --from=build /app /app` (全コピー) → 必要なディレクトリのみコピーに変更
- 除外: client ソース、e2e テスト、seeds データ等

## 効果
- 計測不能だったユーザーフロー3つのうち2つ（検索、投稿）が計測可能になる見込み（最大100点分）
- Docker イメージサイズ削減

## VRT 結果

未計測

## 計測結果

未計測
