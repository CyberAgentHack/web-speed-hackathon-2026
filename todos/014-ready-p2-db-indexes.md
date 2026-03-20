---
status: ready
priority: p2
issue_id: "014"
tags: [server, performance, database, sqlite, indexes]
dependencies: []
---

# SQLite インデックス追加: フルスキャン排除

## Problem Statement

DB ベンチマーク（2026-03-20）で複数クエリがフルテーブルスキャン。特に `n_plus_1_comments` が **84ms**、`dm_messages` が **27ms** と遅い。

セカンダリインデックスが一切なく、autoindex（PK）のみ。

## Findings

**EXPLAIN QUERY PLAN 結果（フルスキャン）:**

| クエリ | median | 問題 |
|--------|--------|------|
| n_plus_1_comments | 84ms | Comments を SCAN × 20回（相関副問い合わせ） |
| dm_messages | 27ms | DirectMessages を SCAN + TEMP B-TREE |
| comments_by_post | 5.5ms | Comments を postId で SCAN |
| posts_list | 0.9ms | Posts を SCAN + TEMP B-TREE for ORDER BY |
| posts_by_user | 1.1ms | Posts を userId で SCAN |
| images_by_post | 0.6ms | PostsImagesRelations を postId で SCAN |

**必要なインデックス:**
- `Comments(postId)` — コメント取得の高速化
- `Posts(createdAt)` — タイムライン ORDER BY の高速化
- `Posts(userId)` — ユーザー投稿一覧の高速化
- `DirectMessages(conversationId, createdAt)` — DM 取得の高速化
- `PostsImagesRelations(postId)` — 画像リレーション JOIN の高速化

## Proposed Solutions

### Option 1: Sequelize migration でインデックス追加

**Effort:** 30 分
**Risk:** Low（読み取り専用インデックスなのでデータに影響なし）
**期待効果:** n_plus_1_comments 84ms → <5ms、dm_messages 27ms → <1ms

## Recommended Action

Option 1。initialize API でDB リセット後もインデックスが作られるよう、モデル定義に `indexes` を追加。

## Acceptance Criteria

- [ ] Comments(postId) インデックスが存在
- [ ] Posts(createdAt) インデックスが存在
- [ ] Posts(userId) インデックスが存在
- [ ] DirectMessages(conversationId, createdAt) インデックスが存在
- [ ] PostsImagesRelations(postId) インデックスが存在
- [ ] `POST /api/v1/initialize` 後もインデックスが再作成される
- [ ] `GET /api/v1/posts` の RPS が 2 → 50+ に改善

## Work Log

### 2026-03-20 - ベンチマーク計測 & 問題特定

**By:** Claude Code

**Actions:**
- bench/db.sh で 12 クエリの実行時間を計測
- EXPLAIN QUERY PLAN で全クエリのインデックス使用状況を確認
- セカンダリインデックスが一切ないことを確認

**Learnings:**
- SQLite の autoindex は PK のみ
- Comments テーブル 46,107 行、DirectMessages 198,844 行 → フルスキャンのコスト大
- インデックス追加は最もリスクが低くインパクトが高い改善
