# サーバー側: gzip 圧縮 + キャッシュ設定

## 変更内容

### app.ts
- `compression` ミドルウェアを追加 → 全レスポンスを gzip 圧縮
  - JS 739KB → 232KB（69%削減）
- `Cache-Control: max-age=0` のミドルウェアを API (`/api/v1`) のみに限定
  - 静的ファイルがキャッシュ可能になった

### static.ts
- `/scripts` ディレクトリ（ハッシュ付き JS/CSS/wasm/フォント）に長期キャッシュ設定
  - `Cache-Control: public, max-age=31536000, immutable`（1年）
  - ref: https://web.dev/articles/http-cache
- 画像・フォント等の静的ファイルで `etag: true, lastModified: true` を有効化
  - 2回目以降のリクエストで 304 Not Modified が使えるように

## VRT 結果

45 passed / 3 flaky / 4 failed（すべて既知の flaky、新規失敗なし）

## 計測結果

リモートで計測予定
