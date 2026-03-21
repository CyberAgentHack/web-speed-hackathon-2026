---
status: ready
priority: p2
issue_id: "020"
tags: [perf, home, fcp, css, critical]
dependencies: []
---

# Critical CSS inline + 残りを非同期ロード

## Problem Statement

CSS（33KB raw / 6.2KB br）が `<link rel="stylesheet">` で render-blocking。ペイントはCSS DL + パース完了まで完全にブロックされる。

## Findings

- `<link rel="stylesheet" crossorigin="" href="/assets/index.CCU6iM6X.css"/>` — render-blocking
- Tailwind v4 で生成、全ページ分のスタイルが1ファイル
- ファーストビューに必要なCSSは全体の一部のみ

## Proposed Solutions

### A: Critical CSS を `<style>` でインライン + 残りを非同期
- ビルド時に critters / critical 等で抽出
- `<style>` でファーストビュー分をインライン
- 残りを `<link rel="preload" as="style" onload="this.rel='stylesheet'">`
- **リスク:** Tailwind v4 + Vite 8 での critters 互換性未確認
- **工数:** 高

### B: CSS を media query で分割
- `media="print"` + `onload="this.media='all'"` パターン
- 簡易的な非同期化
- **工数:** 低（ただし全CSSが非同期になりFOUCリスク）

### C: CSS サイズ自体を削減
- 未使用スタイルの purge 確認
- Tailwind v4 は使用クラスのみ生成するはずだが確認要
- **工数:** 低

## Recommended Action

まず C で CSS サイズを確認。6.2KB br なら A の効果は限定的かもしれない。他の施策の後に再評価。

## Acceptance Criteria

- [ ] FCP への CSS ブロッキング影響が軽減される
- [ ] FOUC（Flash of Unstyled Content）が発生しないこと
- [ ] VRT パス

## Work Log

### 2026-03-21 - 作成

**By:** Claude Code

**Actions:**
- CSS 33KB raw / 6.2KB br を確認
- render-blocking であることを確認
