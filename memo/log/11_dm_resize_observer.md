# DirectMessagePage の1msポーリングを ResizeObserver に置換

## 変更内容

- `DirectMessagePage.tsx` の `useEffect` 内で `setInterval(() => getComputedStyle(document.body), 1)` による1msポーリングを削除
- `ResizeObserver` による body 高さ監視に置換
- 目的（最新メッセージへの自動スクロール）は維持

## 問題点

- 毎秒1000回 `getComputedStyle` を呼び、reflow を強制し続けていた
- DMページが表示されている間ずっとメインスレッドをブロック
- TBT (Total Blocking Time) に直撃

## 効果

- メインスレッドのポーリング負荷がほぼゼロに
- TBT の大幅改善が見込まれる

## VRT 結果

未計測

## 計測結果

未計測
