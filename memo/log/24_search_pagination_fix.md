# 24. 検索API ページネーション修正 (2026-03-21)

## 背景

VRTで「検索結果のタイムラインが無限スクロールで追加読み込みされること」が常に失敗していた。

## 調査

### 元のコードの問題

search.ts では2つのクエリ（テキスト検索 + ユーザー名検索）を実行し、結果をマージしていた。

1. `postsByText = Post.findAll({ limit, offset, subQuery: false })` — DB側でページング
2. `postsByUser = Post.findAll({ limit, offset, subQuery: false })` — DB側でページング
3. マージ・重複排除・ソート
4. `mergedPosts.slice(offset, offset + limit)` — JS側でもう一度ページング

2つの問題が重なっていた:
- **offset 二重適用**: DB側で1回、JS側でもう1回 offset が掛かり、2ページ目以降が空になる
- **subQuery: false + JOIN による行膨張**: defaultScope の include でJOINすると、1つの Post に複数 images がある場合に行が増殖。`subQuery: false` だとSQLレベルの LIMIT が膨張後の行数に掛かるため、limit=30 でも19件しか返らない

### 修正内容

1. DBクエリから `limit/offset` と `subQuery: false` を除去（全件取得）
2. マージ・ソート後にJS側で1回だけ `slice(offset, offset + limit)` で切り出し
3. VRTスナップショット更新（件数表示が19→1155件に変わったため）

### パフォーマンス影響

DBクエリから limit/offset を外したが、以下の理由で影響はほぼない:
- SQLite + 小規模データ（検索ヒットは最大でも数千件）
- defaultScope の include（JOIN）が支配的で、limit/offset の有無でコストは変わらない
- マージ処理のためにどのみち全件がメモリに乗る設計

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `server/src/routes/api/search.ts` | DBクエリから limit/offset/subQuery:false 除去、JS側 slice で一括ページング |
| `e2e/src/search.test.ts-snapshots/search-検索結果-Desktop-Chrome-linux.png` | 件数表示変更に伴うスナップショット更新 |

## VRT結果

修正前: 検索テスト 15 passed / 2 failed（無限スクロール + 検索結果VRT）
修正後: **検索テスト 17 passed / 0 failed**
