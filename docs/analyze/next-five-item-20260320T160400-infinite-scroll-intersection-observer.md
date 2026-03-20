# Next Five Item Report: InfiniteScroll を IntersectionObserver 化

## 1. 対象項目

- `InfiniteScroll` を `IntersectionObserver` 化して、`2 ** 18` ループと `passive: false` 監視をやめる

## 2. 読んだ docs

- `README.md`
- `web-speed-hackathon-2026/README.md`
- `web-speed-hackathon-2026/docs/regulation.md`
- `web-speed-hackathon-2026/docs/scoring.md`
- `web-speed-hackathon-2026/docs/test_cases.md`
- `web-speed-hackathon-2026/application/README.md`
- `web-speed-hackathon-2026/scoring-tool/README.md`
- `docs/template/all-practice-checklist-web-speed-hackathon-2026.md`

## 3. 影響範囲

- 主戦場
  - `application/client/src/components/foundation/InfiniteScroll.tsx`
- 利用箇所
  - `application/client/src/containers/TimelineContainer.tsx`
  - `application/client/src/containers/SearchContainer.tsx`
  - `application/client/src/containers/UserProfileContainer.tsx`
  - `application/client/src/containers/PostContainer.tsx`
- 関連 hook
  - `application/client/src/hooks/use_infinite_fetch.ts`
- 影響ページ
  - ホーム
  - 検索
  - ユーザー詳細
  - 投稿詳細

## 4. 実装前の仮説

- 現状の `InfiniteScroll.tsx` は `scroll` / `wheel` / `touchmove` / `resize` を `passive: false` で監視し、イベントごとに `Array.from(Array(2 ** 18))` を実行している
- これは無限スクロール導線のたびにメインスレッドへ高い負荷を与えるホットパスで、スクロール時の TBT / INP に悪影響がある
- `IntersectionObserver` に置き換えれば、レギュレーションに抵触せず、チェックリストの「遅延読み込みや無限スクロール等を実装するときは Intersection Observer API を使う」に直接一致する

## 5. リスク分類と採用した方針

- リスク分類: `safe`
- 理由
  - 既存の `fetchMore: () => void` 契約を維持できる
  - UI の見た目を変えずに実装できる
  - `IntersectionObserver` は最新 Chrome で利用可能
- 比較した案
  - 最小変更案: `InfiniteScroll.tsx` のみ sentinel + observer に置換
  - 効果優先案: `useInfiniteFetch` まで含めて事前読み込みや root 調整を広く最適化
  - 安全優先案: 最小変更案
- 採用
  - 安全優先で `InfiniteScroll.tsx` のみ変更

## 6. 実装内容

- `InfiniteScroll.tsx` のスクロールイベント監視を削除
- `Array.from(Array(2 ** 18))` を削除
- `sentinel` 要素を末尾に追加
- `IntersectionObserver` で sentinel 可視時に `fetchMore()` を呼ぶ構成へ変更
- `rootMargin: "200px 0px"` を設定し、画面下端ぴったりより少し前に読み込みを始めるようにした
- `latestItem` が変わるたび observer を張り直し、短いページでも連続して追加取得できる状態を維持した

## 7. 検証結果

- build
  - `pnpm --dir web-speed-hackathon-2026/application --filter @web-speed-hackathon-2026/client build`: 成功
- typecheck
  - `pnpm --dir web-speed-hackathon-2026/application --filter @web-speed-hackathon-2026/client typecheck`: 成功
- VRT / E2E
  - `E2E_WORKERS=1 pnpm --dir web-speed-hackathon-2026/application --filter @web-speed-hackathon-2026/e2e exec playwright test src/home.test.ts src/post-detail.test.ts src/search.test.ts src/user-profile.test.ts src/responsive.test.ts`
  - 33 tests passed
- 手動テスト相当の裏取り
  - `search.test.ts` の「検索結果のタイムラインが無限スクロールで追加読み込みされること」が成功
  - ホーム / 投稿詳細 / ユーザー詳細 / レスポンシブの VRT が成功
- Lighthouse 監査補助
  - `uses-passive-event-listeners` は score `1` で、検出対象 item は空

## 8. スコア変化

- 変更前 artifact
  - `application/reports/lighthouse/home.mobile.report.json`
    - `mainthread-work-breakdown`: `21.9 s`
    - `total-blocking-time`: `19,960 ms`
  - `application/reports/lighthouse/home.desktop.report.json`
    - `mainthread-work-breakdown`: `8.4 s`
    - `total-blocking-time`: `7,430 ms`
- 変更後の再計測
  - `application/reports/lighthouse/home.mobile.report.json`
    - `mainthread-work-breakdown`: `25.7 s`
    - `total-blocking-time`: `23,830 ms`
  - `application/reports/lighthouse/home.desktop.report.json`
    - 並列実行時の値は `7.4 s` / `6,650 ms` だったが、比較条件が悪く参考値扱い
- 判定
  - `home.mobile` では改善を確認できず、むしろ悪化
  - このため、現時点では採用前提にしない

## 9. リスクと未確認事項

- `IntersectionObserver` 置換自体の表示・機能面リスクは低い
- ただし、今回の改善目的はスコア改善であり、`home.mobile` の再計測ではそれを確認できていない
- `scoring-tool` の `検索` ターゲットでは通常テストは計測できたが、ユーザーフロー側は「検索クエリの入力に失敗しました」で比較不能だった
- Node 実行環境が repo 推奨の `24.14.0` ではなく `22.18.0` で、全コマンドに engine warning が出ている

## 10. 次にやるべきこと

- Node `24.14.0` 環境で `home.mobile` を再計測し、再現性を確認する
- 可能なら `scoring-tool` の `検索` ユーザーフロー失敗原因を先に潰し、INP / TBT の比較軸を作る
- スコア改善が確認できた場合のみ、この差分を採用してコミットする
