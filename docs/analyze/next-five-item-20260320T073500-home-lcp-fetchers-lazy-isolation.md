# next-five item implementation report (2026-03-20)

## 1. 対象項目

- 1) ホームLCP候補画像だけ `loading="eager" + fetchPriority="high"` に切り替える
- 2) `fetchers.ts` を分割し、`pako` を初期経路から除外する
- 3) ホーム経路で使わない重い機能の同期importをルート単位で隔離する（`TimelineItem` の一部を `lazy` 化）

## 2. 読んだ docs

- `README.md` (repo root)
- `web-speed-hackathon-2026/README.md`
- `web-speed-hackathon-2026/docs/regulation.md`
- `web-speed-hackathon-2026/docs/scoring.md`
- `web-speed-hackathon-2026/docs/test_cases.md`
- `application/reports/lighthouse/home.mobile.report.json`

## 3. 影響範囲

- `application/client/src/components/post/ImageArea.tsx`
- `application/client/src/components/timeline/Timeline.tsx`
- `application/client/src/components/timeline/TimelineItem.tsx`
- `application/client/src/containers/AppContainer.tsx`
- `application/client/src/containers/TimelineContainer.tsx`
- `application/client/src/utils/fetchers.ts`
- `application/client/src/utils/http_common.ts` (new)
- `application/client/src/utils/fetch_json.ts` (new)
- `application/client/src/utils/send_json_gzip.ts` (new)

## 4. 実装前の仮説

- ホームの LCP 候補画像の `lazy` を外すと `lcp-lazy-loaded` の失点要因を直接減らせる
- `pako` を `sendJSON` 側へ分離するとホーム初期 JS の parse/eval 負荷が下がる
- `TimelineItem` のメディア・翻訳コンポーネントを `lazy` 化すると main chunk 依存が減る

## 5. 採用した方針

- 安全優先: 画像 eager 対象を「タイムライン内で最初に画像を持つ投稿の先頭画像1枚」に限定
- 互換優先: `fetchers.ts` は互換APIを維持しつつ内部実装だけ分離
- 影響限定: `lazy` 化はホームで読み込まれる `TimelineItem` 内に限定

## 6. 実装内容

- `ImageArea` に `prioritizeLcpCandidate` prop を追加
- `Timeline` で優先対象投稿IDを計算し、該当 `TimelineItem` にだけ優先フラグを渡す
- `TimelineItem` の `MovieArea` / `SoundArea` / `TranslatableText` を `React.lazy` + `Suspense` に変更
- `fetchers.ts` を barrel 化し、`http_common` / `fetch_json` / `send_json_gzip` へ責務分割
- `send_json_gzip.ts` で `pako` を動的 import 化
- `AppContainer` で `sendJSON` を動的 import に変更、`fetchJSON` は `fetch_json` 直参照へ変更
- `TimelineContainer` でも `fetchJSON` を `fetch_json` 直参照へ変更

## 7. 検証結果

- Build: `pnpm build` 成功
- VRT/E2E: `pnpm --filter @web-speed-hackathon-2026/e2e test` 成功（exit 0）
  - 2件 flaky が retry 後に成功
- Lint: 変更ファイルで IDE lint error なし

## 8. スコア変化

- `pnpm analyze:lighthouse:mobile` 実行で `home.mobile.report.json` を再生成
- 現在値（home mobile）:
  - performance: 21
  - LCP: 9467.96ms
  - `lcp-lazy-loaded`: score 1 (pass)
  - bootup-time: 12.1s
  - mainthread-work-breakdown: 16.8s
- 備考:
  - このリポジトリでは `home.mobile.report.json` が Git 管理されておらず、コミット済み基準値との厳密差分は未算出

## 9. リスクと未確認事項

- `TimelineItem` の lazy 化により、初回表示直後に翻訳ボタン・メディアUIが遅れて描画される可能性がある
- E2E は通過したが、flaky が 2 件発生しており、DM系の環境依存不安定性は残る
- Lighthouse は単発計測のため、複数回中央値の評価は未実施

## 10. 次にやるべきこと

- home mobile Lighthouse を複数回実行し中央値比較を取る
- `webpack-stats.json` を再出力し、`main.js` からの `pako` 依存除外をサイズで検証する
- DM flaky の発生条件を分離して、計測環境での安定化を進める
