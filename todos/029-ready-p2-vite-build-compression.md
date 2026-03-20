---
status: ready
priority: p2
issue_id: "029"
tags: [client, performance, build, compression]
dependencies: []
---

# Vite ビルド圧縮最適化

## Problem Statement

Vite ビルドでは esbuild デフォルト minify のみ。事前 Brotli/gzip 圧縮で静的ファイルの初回配信を高速化できる。Bundle Size 13.11 MiB (JS 12.02 MiB) の圧縮率改善余地あり。

## Findings

- `vite.config.ts`: 明示的な minify/compress 設定なし
- Bundle Stats: JS 12.02 MiB, CSS 60.2 KiB, Fonts 1.02 MiB
- Initial JS: 301.91 KiB
- Chunks: 533, Assets: 594, Packages: 127
- negaposi-analyzer-ja: 5.2 MB (辞書データ)
- web-llm: 5.9 MB (LLM ライブラリ)

## Proposed Solutions

### A. vite-plugin-compression で事前圧縮
- `.br` / `.gz` ファイルをビルド時に生成
- サーバー側で事前圧縮ファイルを優先配信
- Effort: 中 | Risk: 低

### B. Terser による minify 強化
- esbuild → terser に切り替えでより高い圧縮率
- ビルド時間は増加
- Effort: 小 | Risk: 低

### C. 重量パッケージの外部化/遅延化
- negaposi-analyzer-ja (5.2MB), web-llm (5.9MB) を外部 CDN or 真の遅延ロード
- Effort: 中 | Risk: 中

## Recommended Action

**A** を実施。ビルド時に .br/.gz を生成し、サーバーで pre-compressed ファイルを配信。

## Acceptance Criteria

- [ ] WHEN `pnpm build` THEN dist/ に .br ファイルが生成される
- [ ] WHEN ブラウザアクセス THEN 事前圧縮ファイルが配信される
- [ ] WHEN Lighthouse 計測 THEN Total Transfer Size が削減

## Work Log
