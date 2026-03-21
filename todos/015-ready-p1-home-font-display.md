---
status: ready
priority: p1
issue_id: "015"
tags: [perf, home, fcp, font]
dependencies: []
---

# font-display 確認・修正

## Problem Statement

フォント `ReiNoAreMincho-Heavy-subset.woff2`（26KB）が `<link rel="preload">` で読み込まれている。`font-display` が `block` や未指定の場合、フォントDL完了までテキストが非表示（FOIT）になりFCPが遅れる。

## Findings

- `<link rel="preload" as="font" type="font/woff2" href="/fonts/ReiNoAreMincho-Heavy-subset.woff2" crossorigin=""/>` がSSR HTMLの `<head>` にある
- CSS内の `@font-face` の `font-display` 値が未確認
- FCP 3.80/10 — テキスト表示がブロックされている可能性

## Proposed Solutions

### A: `font-display: swap` に設定
- システムフォントで即表示 → フォントDL後に差し替え
- FOUT（Flash of Unstyled Text）は出るがFCPは改善
- **工数:** 低

### B: `font-display: optional` に設定
- キャッシュにあれば使う、なければシステムフォントのまま
- FOUTも出ない。ただし初回訪問ではカスタムフォント非表示
- **工数:** 低

## Recommended Action

A: `font-display: swap` — FCPへの即効性が高い

## Acceptance Criteria

- [ ] `@font-face` に `font-display: swap` が設定されている
- [ ] FCP スコアが改善（または変化なし確認）
- [ ] VRT パス（フォント差し替えでレイアウトずれないこと）

## Work Log

### 2026-03-21 - 作成

**By:** Claude Code

**Actions:**
- SSR HTMLでフォント preload を確認
- font-display 値の確認が必要
