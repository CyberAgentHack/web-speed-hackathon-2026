# InfiniteScroll: 262,144回ループを IntersectionObserver に置換

## 変更内容

### InfiniteScroll.tsx
- スクロール最下部判定で `Array.from(Array(2 ** 18), ...)` による262,144回ループを削除
- 4つのイベントリスナー（wheel, touchmove, resize, scroll）を削除
- IntersectionObserver + sentinel 要素によるネイティブ判定に置換
  - `rootMargin: "200px"` で手前から次ページ取得開始
- 機能的に等価（エッジ検出、マウント時即発火、アイテムなしガードすべて維持）

## 影響
- スクロール時のメインスレッドブロックが解消
- TBT (Total Blocking Time) 改善が見込まれる

## VRT 結果

未計測

## 計測結果

未計測
