# Next Five Item Report: Search Sentiment Lazy Load

## 1. 対象項目

- 項目: `negaposi-analyzer-ja` と `kuromoji` のロード条件を検索入力後に遅らせる
- 対象ページ: 検索ページ (`/search`)
- 狙い: 検索結果描画を優先し、重い辞書ロードを低優先度化して初期実行負荷を下げる

## 2. 読んだ docs

- `README.md`
- `web-speed-hackathon-2026/docs/regulation.md`
- `web-speed-hackathon-2026/docs/scoring.md`
- `web-speed-hackathon-2026/docs/test_cases.md`
- `docs/template/all-practice-checklist-web-speed-hackathon-2026.md`
- `.agents/skills/next-five-report/referencesnext-five-report-20260320T155458.md`

## 3. 影響範囲

- 直接変更:
  - `application/client/src/components/application/SearchPage.tsx`
- 調査のみ:
  - `application/client/src/utils/negaposi_analyzer.ts`
  - `application/client/src/utils/load_kuromoji_tokenizer.ts`
  - `application/e2e/src/search.test.ts`
- 依存観点:
  - 検索のネガティブ判定 UI（「どしたん話聞こうか?」）
  - 検索結果表示と無限スクロール

## 4. 実装前の仮説

- `reports/webpack-stats.json` では `negaposi-analyzer-ja/dict/pn_ja.dic.json` が約 4.20MB、`kuromoji` が約 0.29MB で上位。
- 検索クエリがある場合の即時感情分析起動をやめ、描画後の idle 実行にすると、検索遷移時の main thread ブロッキングを抑えやすい。
- 手動テストの「ネガティブ判定メッセージ表示」は維持しつつ、表示タイミングのみ遅れる可能性がある。

## 5. 採用した方針

- 安全優先案を採用:
  - 感情分析機能そのものは削除しない
  - 検索結果表示を先に行い、感情分析は `requestIdleCallback` で遅延
  - `requestIdleCallback` 非対応環境は `setTimeout` でフォールバック
  - 読み込み中メッセージを追加して UX の不透明さを低減

## 6. 実装内容

- `SearchPage.tsx` で `SentimentStatus` を導入（`idle` / `loading` / `done`）。
- `parsed.keywords` 存在時の処理を次の順に変更:
  - 先に `sentimentStatus=loading`
  - `requestIdleCallback(..., { timeout: 1500 })` で `analyzeSentiment()` を実行
  - フォールバックとして `setTimeout(..., 600)`
  - 終了時に `sentimentStatus=done`
- キーワードなし時は `isNegative=false` と `sentimentStatus=idle` を明示。
- `loading` 中かつ `isNegative` でない場合、補助テキスト `感情分析を読み込み中...` を表示。

## 7. 検証結果

- TypeScript:
  - `pnpm --dir web-speed-hackathon-2026/application --filter @web-speed-hackathon-2026/client run typecheck`
  - 結果: pass
- VRT/E2E（検索）:
  - `pnpm --dir web-speed-hackathon-2026/application --filter @web-speed-hackathon-2026/e2e run test -- src/search.test.ts`
  - 結果: 17 passed
  - ネガティブ判定関連ケースを含めて pass
- Lighthouse（検索ページ, desktop）:
  - `pnpm --dir web-speed-hackathon-2026/application run analyze:lighthouse -- --url "http://localhost:3000/search?q=%E6%82%B2%E3%81%97%E3%81%84" --device desktop`
  - 結果: レポート生成成功

## 8. スコア変化

- 今回取得値（検索ページ desktop, 悲しいクエリ）:
  - Performance: `0.81`
  - FCP: `512.64ms`
  - SI: `823.95ms`
  - LCP: `868.96ms`
  - TBT: `421ms`
  - CLS: `0.006115`
- 変更直前に同一条件の baseline を再計測していないため、厳密な before/after 差分は未取得。

## 9. リスクと未確認事項

- リスク:
  - ネガティブ判定メッセージの表示は従来より遅れる可能性がある
  - `requestIdleCallback` 実行タイミングは端末負荷に依存する
- 未確認:
  - mobile 条件での Lighthouse 同条件比較
  - 競技 scoring-tool での検索シナリオ個別再計測（INP/TBT）

## 10. 次にやるべきこと

- 同一条件で before/after の Lighthouse（mobile/desktop）を揃えて再計測する。
- scoring-tool の検索シナリオで INP/TBT の変化を確認する。
- 必要なら「読み込み中」表示を skeleton などへ改善し、体感 UX を整える。
