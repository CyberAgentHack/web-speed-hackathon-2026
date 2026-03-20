---
status: ready
priority: p2
issue_id: "024"
tags: [e2e, vrt, css, layout]
dependencies: []
---

# VRT スクリーンショット差異（dm詳細, 検索結果, 利用規約）

## Problem Statement

3 つの VRT テストで初期コミット baseline との差異が残る:
1. dm:83 DM詳細 — 0.08 pixel ratio 差異
2. search:93 検索結果 — 差異内容未確認
3. terms:15 利用規約 — 差異内容未確認

## Findings

- 投稿順序は修正済み（ordering fix）
- SSR hydration も修正済み
- 残る差異は CSS/レイアウトの微妙な違い（フォント、スペーシング、色）の可能性
- Tailwind v4 CDN → PostCSS ビルドへの変更による出力差異？

## Proposed Solutions

### A. 差異の可視化と CSS 修正

各テストの diff.png を確認し、具体的な CSS プロパティの違いを特定して修正。

### B. baseline 再取得（最終手段）

差異が機能的に同等（Tailwind バージョン差等）であれば、現在のサーバーで baseline 再取得。

## Recommended Action

まず diff.png を確認して差異の性質を判断。機能落ちなら CSS 修正、許容範囲なら baseline 再取得。

## Acceptance Criteria

- [ ] dm:83 VRT pass
- [ ] search:93 VRT pass
- [ ] terms:15 VRT pass

## Work Log

### 2026-03-20 - 分類

**By:** Claude Code

**Actions:**
- フルテスト結果から VRT 差異 3件を特定
- dm:83 は 0.08 pixel ratio と確認
