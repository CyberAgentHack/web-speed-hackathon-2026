# 05 DM Auto Scroll Polling Removal

## 背景

DM詳細画面で `setInterval(..., 1ms)` により常時スクロール位置を監視しており、CPU負荷が高い状態だった。

## 実施内容

- `application/client/src/components/direct_message/DirectMessagePage.tsx`
  - 1ms ポーリングを完全削除
  - 末尾アンカー (`scrollBottomRef`) を導入
  - `conversation.messages.length` 変化時、および入力中インジケータ変化時にのみ `scrollIntoView` 実行
  - 既存の「初期表示で最下部」「新着時に最下部追従」の要件を維持

## 影響範囲

- DM 詳細画面の描画・スクロール挙動

## リスクと対策

- リスク: 特定ブラウザで `scrollIntoView` のタイミング差
- 対策: メッセージリスト末尾に固定アンカーを設置し、毎回同じターゲットへスクロール

## 検証結果

- `pnpm --dir application/client exec tsc --noEmit` 成功
- ローカル採点計測は方針により未実施
