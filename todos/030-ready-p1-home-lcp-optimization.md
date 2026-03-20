---
status: ready
priority: p1
issue_id: "030"
tags: [performance, lighthouse, lcp, home]
dependencies: []
---

# home の LCP 3,586ms を改善する

## Problem Statement

Lighthouse bench で home ページの LCP が 3,586ms と全ページ中最悪。FCP(2,146ms) → LCP の差が約1.4秒あり、メインコンテンツ（画像等）の読み込み遅延が原因。Score 88 で全ページ最低。

## Findings

- **Lighthouse (3 runs median):** FCP=2,146ms, SI=2,874ms, LCP=3,586ms, TBT=22ms, Score=88
- FCP→LCP 差 1,440ms は画像/動画/コンテンツのロード遅延を示唆
- TBT=22ms なので JS 実行はボトルネックではない
- home は投稿一覧を表示するページで、API `get_posts` が 594ms / 16 RPS と遅い
- DB `n_plus_1_comments` クエリが 112ms — コメント数取得で N+1 発生

## Acceptance Criteria

- [ ] home の LCP が 2,500ms 以下
- [ ] Lighthouse Score が 90 以上
- [ ] VRT が通ること

## Work Log

### 2026-03-20 - Bench 計測結果記録

**By:** Claude Code

**Actions:**
- lighthouse.sh 3回計測: FCP=2,146ms, LCP=3,586ms, Score=88
- API bench: get_posts 594ms/16RPS が最大ボトルネック
- DB bench: n_plus_1_comments 112ms (フルスキャン)

**Learnings:**
- home の LCP は API レスポンス速度に強く依存
- get_posts の N+1 解消が LCP 改善の鍵
