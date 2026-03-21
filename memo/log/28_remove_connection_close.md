# 28. Connection: close ヘッダー除去 (2026-03-21)

## 変更内容

API レスポンスの `Connection: close` ヘッダーを削除し、HTTP keep-alive を有効化。

## 理由

`Connection: close` により毎回TCPコネクションが切断され、APIリクエストごとにTCPハンドシェイクが発生していた。ページ表示中に複数のAPIコール（posts, users 等）があるため、keep-alive でコネクションを再利用することでレイテンシを削減できる。

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `server/src/app.ts` | `Connection: "close"` ヘッダー削除 |
