# 06 Server Cache and Connection Optimization

## 背景

サーバーが全レスポンスに `Connection: close` を付与し、静的配信では `etag`/`lastModified` を無効化していたため、再利用効率と接続効率が低かった。

## 実施内容

- `application/server/src/app.ts`
  - 全体共通ヘッダから `Connection: close` を削除
  - API 配下に限定して `Cache-Control: no-store` を設定
- `application/server/src/routes/static.ts`
  - `serve-static` の `etag` と `lastModified` を有効化
  - キャッシュ方針を用途別に分離
    - `upload`: `maxAge: 0`
    - `public`, `dist`: `maxAge: 1h`

## 影響範囲

- API と静的ファイル配信全体

## リスクと対策

- リスク: 静的キャッシュの残留による更新反映遅延
- 対策: `maxAge` を短め（1h）に設定し、`etag/lastModified` で再検証可能に維持

## 検証結果

- `pnpm --dir application/server exec tsc --noEmit` 成功
- クライアントビルド成功を確認
- ローカル採点計測は方針により未実施
