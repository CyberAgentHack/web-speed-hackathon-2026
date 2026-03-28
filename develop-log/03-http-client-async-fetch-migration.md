# 03 HTTP Client Async Fetch Migration

## 背景

クライアント通信が `jQuery.ajax` + `async: false`（同期XHR）で実装されており、メインスレッドをブロックする構造になっていた。

## 実施内容

- `application/client/src/utils/fetchers.ts`
  - `jQuery` 依存を廃止し、`fetch` ベースに全面移行
  - `HttpError` クラスを追加（`status` と `body` を保持）
  - `fetchBinary`, `fetchJSON`, `sendFile`, `sendJSON` を非同期実装に置換
  - 既存仕様を維持するため `sendJSON` の gzip 圧縮送信は継続
- `application/client/src/containers/AuthModalContainer.tsx`
  - エラー解析を `JQuery.jqXHR` 前提から `HttpError` 前提に変更
  - サインイン/サインアップ時の既存エラーメッセージ分岐を維持

## 影響範囲

- 認証、投稿、検索、DM を含む全 API 通信経路
- エラーハンドリング共通処理

## リスクと対策

- リスク: API エラー形式のパース差異で文言分岐が崩れる可能性
- 対策: `HttpError.body` を使って既存 `code` ベース判定を保持

## 検証結果

- `pnpm --dir application/client exec tsc --noEmit` 成功
- ビルド成功を確認
- ローカル採点計測は方針により未実施
