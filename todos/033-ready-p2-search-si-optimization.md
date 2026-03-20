---
status: ready
priority: p2
issue_id: "033"
tags: [performance, lighthouse, search, si]
dependencies: []
---

# search ページの SI 3,245ms を改善する

## Problem Statement

search ページの Speed Index が 3,245ms と全ページ中最悪。FCP(2,002ms) は他ページと同程度だが、FCP→SI の差が 1,243ms あり、スクロール後の視覚的完成までが遅い。

## Findings

- **Lighthouse (median):** FCP=2,002ms, SI=3,245ms, LCP=2,415ms, Score=95
- FCP→SI 差 1,243ms — 初期表示後に段階的にコンテンツがレンダリングされている
- API bench: get_search avg=19.4ms, RPS=503 — API 自体は高速
- DB bench: search_posts median=0.99ms — LIKE 検索だがデータ量的に問題なし
- SI が悪い原因は API ではなくクライアントサイドのレンダリング（画像遅延ロード等）
- **Lighthouse score が 84→95→97 と不安定（CV 高）** — 初回ロード時が特に遅く、キャッシュ有無で差が出ている可能性

## Acceptance Criteria

- [ ] search の SI が 2,500ms 以下
- [ ] Lighthouse Score 95 以上を維持
- [ ] VRT が通ること

## Work Log

### 2026-03-20 - Bench 計測結果記録

**By:** Claude Code

**Actions:**
- Lighthouse 3回計測: SI=3,245ms
- API/DB bench で search 系は高速であることを確認

**Learnings:**
- ボトルネックはサーバーサイドではなくクライアントサイドのレンダリング
- 画像の lazy loading 戦略や CSS レンダリング最適化が必要
