# Next Five Items Implementation Report

## 1. 対象項目

今回まとめて扱った項目は次の 5 件です。

1. 一覧画像をサムネイル配信に変える
2. `img` に `width` / `height` / `decoding` を入れる
3. Crok の markdown / syntax highlight / KaTeX / tokenizer をさらに遅延ロードする
4. 検索の感情分析辞書ロードを入力後に後ろ倒しする
5. `splitChunks` を見直して、重い依存を初期 bundle から剥がす

## 2. 読んだ docs

- `README.md`
- `docs/regulation.md`
- `docs/scoring.md`
- `docs/test_cases.md`
- `scoring-tool/README.md`
- `docs/template/all-practice-checklist-web-speed-hackathon-2026.md`
- `.agents/skills/next-five-report/referencesnext-five-report-20260320T155458.md`

## 3. 影響範囲

- ホーム / ユーザー詳細 / 検索 / 投稿詳細の画像表示
- Crok の入力欄、サジェスト、AI 応答レンダリング
- 投稿詳細の翻訳ボタン
- client bundle の async chunk 構成
- 画像アップロード API の保存処理

## 4. 実装前の仮説

- ホームの LCP/TBT を最も押し下げているのは、過大画像と初期 JS 実行量
- 一覧画像は detail 用の原寸近いアセットを使っており、一覧だけサムネイル化しても表示維持しやすい
- Crok と検索は route lazy は入っているが、画面表示前に読み込まなくてよい依存がまだ残っている
- `splitChunks` は entry 直分割まで触ると `index.html` の固定 script 参照に影響するため、今回は async 側だけを安全に見直す

## 5. 採用した方針

- 画像は detail 用の原本を残したまま、一覧だけ `.thumb.webp` に切り替える安全優先案を採用
- `img` 属性は共通 `AvatarImage` コンポーネントで統一
- Crok / 検索 / 翻訳は「実際に使う直前に import する」方式で段階的に後ろ倒し
- `splitChunks` は `async` のみ有効化し、初期 HTML の固定 `main.js` 契約は壊さない

## 6. 実装内容

### 6-1. 一覧画像のサムネイル配信

- 追加:
  - `application/scripts/generate-image-thumbnails.mjs`
- 生成:
  - `application/public/images/*.thumb.webp` を 30 件生成
  - `application/reports/image-thumbnail-report.json` を出力
- 実装:
  - `getImagePath(imageId, "thumb")` を追加
  - `TimelineItem` だけ `ImageArea variant="thumb"` を使うよう変更
  - 画像アップロード時も `upload/images/<id>.thumb.webp` を同時生成するように変更

### 6-2. `img` 属性の整理

- 追加:
  - `application/client/src/components/foundation/AvatarImage.tsx`
- 変更:
  - timeline / post / comment / DM / account menu / user profile header の avatar に `width` / `height` / `decoding="async"` を統一
  - `CoveredImage` に `width` / `height` / `decoding` / `fetchPriority` 対応を追加

### 6-3. Crok 遅延ロード

- 追加:
  - `application/client/src/components/crok/CrokMarkdownMessage.tsx`
- 変更:
  - `ChatMessage.tsx` から markdown / KaTeX / syntax highlight の static import を外し、`lazy()` + `Suspense` に変更
  - `ChatInput.tsx` の tokenizer 初期化を mount 時ではなく `focus` / 入力開始後に変更

### 6-4. 検索の感情分析辞書ロード後ろ倒し

- 変更:
  - `SearchPage.tsx` で `negaposi_analyzer` の static import をやめ、検索キーワード確定後に dynamic import
  - 250ms 遅延を入れて、検索結果表示を優先

### 6-5. 初期 bundle からの依存剥離

- 変更:
  - `TranslatableText.tsx` で `createTranslator` を click 時 dynamic import に変更
  - `rspack.config.js` で `optimization.splitChunks` を `async` ベースで有効化

## 7. 検証結果

### 自動検証

- `pnpm --dir application run build`
  - 成功
- `pnpm --dir application run typecheck`
  - 成功
- `pnpm --dir application --filter @web-speed-hackathon-2026/e2e run test`
  - `.last-run.json` で `passed`
  - DM 系で 2 件の retry は発生したが最終成功

### VRT / 手動テスト観点

- Playwright で次を通過
  - ホーム画像の cover 表示
  - 投稿詳細写真の画質・表示
  - 検索のネガティブ判定
  - Crok のサジェスト表示と応答表示
  - レスポンシブ表示
- 画像 detail の原本表示は維持しているため、画質劣化リスクは一覧側に限定

## 8. スコア変化

### Lighthouse 再計測

- 計測 artifact:
  - `application/reports/webpack-stats.json` `2026-03-20 16:15:23`
  - `application/reports/lighthouse/home.mobile.report.json` `2026-03-20 16:15:21`
  - `application/reports/lighthouse/home.desktop.report.json` `2026-03-20 16:15:19`

### Home / mobile

- score: `0.41 -> 0.45`
- LCP: `52.5s -> 29.9s`
- TBT: `30,350ms -> 18,930ms`
- Speed Index: `5.5s -> 1.5s`
- `uses-responsive-images`: `28,825 KiB -> 1,849 KiB`
- `unused-javascript`: `84 KiB -> 45 KiB`
- `mainthread-work-breakdown`: `32.9s -> 20.0s`
- `bootup-time`: `20.9s -> 14.5s`

### Home / desktop

- score: `0.45 -> 0.57`
- LCP: `22.2s -> 2.5s`
- TBT: `7,430ms -> 4,300ms`
- Speed Index: `1.0s -> 0.4s`
- `uses-responsive-images`: `21,274 KiB -> 1,789 KiB`
- `unused-javascript`: `84 KiB -> 45 KiB`
- `mainthread-work-breakdown`: `8.4s -> 5.0s`
- `bootup-time`: `5.7s -> 3.6s`

### Bundle

- `scripts/main.js`: `344,663 bytes -> 320,389 bytes`
- entrypoint `main`: `388.115 KiB -> 364.671 KiB`

### scoring-tool

- フル完走までは待たず中断したが、途中の `ホームを開く` は `44.50 / 100` を確認
- 今回は採点ツール全件より Lighthouse 前後差を主根拠に採用判断

## 9. リスクと未確認事項

- `splitChunks` は async 側のみで、entry の完全分割までは未対応
  - `index.html` が `/scripts/main.js` を固定参照しているため、ここを崩す変更は別途確認が必要
- 採点ツールの全 9 ページ + 5 シナリオは未完走
- ブラウザでの完全手動確認は Playwright 通過を主としており、人手の目視確認は未実施
- サムネイルは一覧専用なので、一覧画質の微差は残る

## 10. 次にやるべきこと

1. `index.html` の asset 注入方式を見直し、entry の本格 split を安全に試す
2. 一覧 LCP の対象画像だけ `fetchPriority` / eager を個別調整する
3. `react-router` / `react-dom` 以外の main chunk 常駐コードをさらに削る
4. scoring-tool を全件完走させて、ページ表示 9 件と操作 5 件の合計差分を取る
