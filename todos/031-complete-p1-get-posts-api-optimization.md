---
status: ready
priority: p1
issue_id: "031"
tags: [performance, api, database, n-plus-1]
dependencies: []
---

# API get_posts の 594ms / 16 RPS を改善する

## Problem Statement

API bench で `GET /api/v1/posts` が平均 594ms、16 RPS と全エンドポイント中最悪。DB bench の `n_plus_1_comments` が 112ms で、投稿一覧のコメント数取得で N+1 クエリが発生している。

## Findings

- **API bench:** get_posts avg=593.9ms, p99=2,992ms, RPS=16
- **DB bench:** n_plus_1_comments median=111.6ms, p95=142.8ms
- **DB bench:** comments_by_post median=8.2ms（Comments テーブルのフルスキャン）
- **DB bench:** dm_messages median=33.2ms（DirectMessages テーブルのフルスキャン）
- EXPLAIN QUERY PLAN で `SCAN p` (Posts フルスキャン) + サブクエリで `SCAN c` (Comments フルスキャン)
- Posts=3,000件, Comments=46,107件 — インデックス未設定で全件スキャン
- **`get_post_detail` が 4/5 ラウンドで 0 RPS** — エンドポイントがタイムアウトまたはエラーを返している可能性。5回目だけ 16.8ms/577RPS で正常動作
- **`get_post_comments` の p99 が round 4 で 295ms に急騰** — 通常 39ms なのに一時的に 7 倍。負荷時にリソース競合が発生
- **`ssr_terms` の round 5 で 1,491ms / 4 RPS に劣化** — 他ラウンドは 12ms/759RPS。同タイミングで `get_crok_suggestions` も 31.8ms/309RPS に劣化。GC またはリソース枯渇の兆候

## Acceptance Criteria

- [ ] get_posts の平均レイテンシが 100ms 以下
- [ ] get_posts の RPS が 100 以上
- [ ] n_plus_1_comments の median が 10ms 以下
- [ ] Comments テーブルに postId インデックスが追加されている
- [ ] VRT が通ること

## Work Log

### 2026-03-20 - Bench 計測結果記録

**By:** Claude Code

**Actions:**
- API bench 5回計測: get_posts avg=594ms, RPS=16
- DB bench 20回計測: n_plus_1_comments=112ms, comments_by_post=8.2ms
- EXPLAIN QUERY PLAN で Comments, Posts のフルスキャン確認

**Learnings:**
- Comments.postId, Posts.userId, Posts.createdAt にインデックスが必要
- Sequelize の eager loading (include) または raw SQL JOIN でN+1解消
- DirectMessages テーブルも conversationId インデックスなし
