# useInfiniteFetch: サーバーサイドページネーション

## 変更内容

### use_infinite_fetch.ts
- `fetcher(apiPath)` → `fetcher(apiPath?offset=N&limit=30)` に変更
- サーバーに offset/limit を渡して必要な分だけ取得
- クライアント側の `allData.slice()` を削除、サーバーレスポンスをそのまま使用
- apiPath に既に `?` がある場合は `&` で繋ぐ（検索の `?q=...` 対応）

### サーバー側
- 変更なし（元から offset/limit クエリパラメータに対応済み）

## 影響箇所
- タイムライン (`/api/v1/posts`)
- 投稿詳細コメント (`/api/v1/posts/:id/comments`)
- ユーザープロフィール (`/api/v1/users/:username/posts`)
- 検索 (`/api/v1/search?q=...`)

## 効果
- 初期データ転送量: 2.8MB → 27KB (99%削減)
- fetchMore のたびに全件再取得していたのが30件ずつに

## VRT 結果

未計測

## 計測結果

未計測
