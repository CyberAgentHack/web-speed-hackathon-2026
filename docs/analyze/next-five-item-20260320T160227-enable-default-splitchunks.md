# 対象項目

- `optimization.splitChunks: false` を外し、Rspack の標準 splitChunks 挙動へ戻す

# 読んだ docs

- `README.md`
- `web-speed-hackathon-2026/docs/regulation.md`
- `web-speed-hackathon-2026/docs/scoring.md`
- `web-speed-hackathon-2026/docs/test_cases.md`
- `web-speed-hackathon-2026/application/README.md`
- `web-speed-hackathon-2026/docs/analyze/next-five-item-20260320T113000-lazy-heavy-deps.md`

# 影響範囲

- `application/client/rspack.config.js`
- `application/reports/webpack-stats.json`
- `application/reports/lighthouse/home.mobile.report.json`
- `application/e2e/src/home.test.ts`
- `application/e2e/src/post-detail.test.ts`

# 実装前の仮説

- 現状でも dynamic import による chunk は出ているが、`splitChunks: false` により共有依存の分離が止まっている。
- 巨大 async chunk の一部が共有されず、route ごとの payload が過大になっている。
- `chunks: "all"` のような攻めた設定は初回ロードに共有 chunk を押し込む可能性があるため、安全側でまず `false` を外すだけにする。

# 採用した方針

- `splitChunks` に値を明示せず、production のデフォルト挙動へ戻す最小変更に留める。
- bundle stats と Lighthouse を見て悪化していないことを確認する。
- 表示互換性は VRT 全件で担保する。

# 実装内容

- `application/client/rspack.config.js`
  - `optimization.splitChunks: false` を削除

# 検証結果

- `pnpm --dir application run build`: 成功
- `ANALYZE=true pnpm --dir application --filter @web-speed-hackathon-2026/client run build`: 成功
- `E2E_WORKERS=1 pnpm --dir application --filter @web-speed-hackathon-2026/e2e run test`: `52 passed`
- `pnpm --dir application run analyze:lighthouse:mobile -- --url http://127.0.0.1:3000/`: 成功

# スコア変化

- bundle
  - 最大 chunk: 約 `42.98 MiB` / `19.52 MiB` / `5.53 MiB` -> 約 `5.53 MiB` / `4.41 MiB` / `1.32 MiB`
  - `main.js`: 約 `344 KiB` 前後で大差なし
- Lighthouse mobile
  - score: `0.44` -> `0.45`
  - FCP: `0.8s` -> `0.8s`
  - LCP: `150.5s` -> `150.7s`
  - Speed Index: `3.2s` -> `1.7s`
  - TBT: `19,960ms` -> `18,820ms`
  - total bytes: `51,557 KiB` -> `51,559 KiB`

# リスクと未確認事項

- home の LCP は依然として極端に悪く、今回の変更だけでは表示スコアの本丸は解決していない。
- Lighthouse の改善は小幅で、計測ぶれを含む可能性がある。
- Node `24.14.0` 想定の repo だが、今回の検証環境は Node `22.18.0` だった。

# 次にやるべきこと

- 5MB / 4MB 級 chunk の中身を特定し、route 単位または action 単位でさらに遅延化する。
- LCP 候補の巨大画像・動画を優先して削減し、表示スコアの主因を崩す。
