# 02 Startup Render Blocking Reduction

## 背景

初期描画時にスクリプト読み込みでパースが止まりやすく、アプリマウントも `window.load` 待機で遅延していた。

## 実施内容

- `application/client/src/index.html`
  - `/scripts/main.js` を `defer` に変更
  - `@tailwindcss/browser` を `defer` に変更
  - `cdn.jsdelivr.net` への `preconnect` を追加
- `application/client/src/index.tsx`
  - `window.addEventListener("load", ...)` を廃止
  - スクリプト評価直後に `createRoot(...).render(...)` を実行する構成に変更

## 影響範囲

- 初回ロード時の起動フロー
- 既存ルーティング・画面機能には非影響

## リスクと対策

- リスク: Tailwind ブラウザランタイムの適用タイミングによって一時的な見た目変化が発生する可能性
- 対策: `defer` 順序を維持し、DOM 解析後に順次実行される構成を保持

## 検証結果

- クライアントビルド成功を確認
- ローカル採点計測は方針により未実施
