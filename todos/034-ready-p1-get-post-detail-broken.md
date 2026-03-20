---
status: ready
priority: p1
issue_id: "034"
tags: [performance, api, sqlite, event-loop-blocking, server]
dependencies: []
---

# better-sqlite3 の同期クエリが event loop をブロックし、サーバー全体が応答不能になる

## Problem Statement

better-sqlite3 (同期 SQLite ドライバ) + Drizzle ORM の組み合わせで、DB クエリが Node.js event loop を完全にブロックする。`/api/v1/posts` の `findPostsDetail()` は 594ms 同期ブロックし、この間サーバーは他のリクエストを一切処理できない。bench 連続実行時に get_post_detail が 4/5 ラウンドで 0 RPS になったのはこれが原因。

## Findings

### 根本原因: better-sqlite3 は完全同期

- `application/server/src/db/index.ts` で `better-sqlite3` + Drizzle を使用
- Drizzle の `.findMany()`, `.findFirst()` 等は better-sqlite3 上では **同期実行**
- `await` しても非同期にならない — Promise が即座に resolve するだけで event loop はブロックされたまま
- `/api/v1/posts` の 30 件 eager load (6 テーブル JOIN) = **594ms event loop ブロック**

### SQLite 設定不足

- `journal_mode = WAL` のみ設定済み
- **未設定:** `busy_timeout`, `synchronous`, `cache_size`, `temp_store`, `mmap_size`
- busy_timeout なしだと、ロック競合時に即座に SQLITE_BUSY で失敗

### サーバー側のリソースリーク

- **sessionStore (Map):** 期限切れセッションの eviction なし — 無限成長
- **SSR キャッシュ (Map):** TTL/LRU なし — URL ごとに HTML が永久保持
- **WebSocket EventEmitter:** `ws.raw` が falsy の場合 cleanup されず listener 蓄積

### bench での再現パターン

- **単独実行:** 1,856 RPS / 4.9ms（正常）
- **get_posts 同時実行:** 162 RPS / 61ms（劣化するが動く）
- **bench 連続実行 (9番目):** 0 RPS（前の 40 ラウンドの累積で event loop が詰まる）

## Acceptance Criteria

- [ ] SQLite pragma を追加: `busy_timeout=5000`, `cache_size=-64000`, `mmap_size=30000000`, `synchronous=NORMAL`, `temp_store=MEMORY`
- [ ] bench 連続実行時でも全エンドポイントが安定動作する
- [ ] sessionStore に TTL/eviction を追加
- [ ] SSR キャッシュに TTL/LRU を追加

## Work Log

### 2026-03-20 - Bench 計測結果記録

**By:** Claude Code

**Actions:**
- API bench 5回計測: 4/5 ラウンドで 0 RPS を確認
- 同時期に ssr_terms(1,491ms), get_crok_suggestions(31.8ms) もスパイク

**Learnings:**
- get_posts の重さがサーバー全体に波及している可能性
- 031 (get_posts 最適化) の解決で連鎖的に改善される可能性あり
- ただし DB ロック（SQLite の WRITE ロック）が原因なら別の対策が必要

### 2026-03-20 - 再現テスト・原因切り分け

**By:** Claude Code

**Actions:**
- get_post_detail 単独実行: 1,856 RPS / 4.9ms — 完全正常
- get_posts と同時実行: 162 RPS / 61ms — 劣化するが動作
- ssr_terms → get_post_detail 連続実行: 再現せず（1,799 RPS）
- autocannon 生データ分析: sent=10, total=0 — リクエスト送信済みだが応答なし
- 全エンドポイントの全ラウンドで pending=10（autocannon keep-alive 仕様）
- bench 実行順序確認: get_post_detail は 9 番目（前に 40 ラウンド実行済み）

**Learnings:**
- 根本原因は better-sqlite3 の同期実行 — event loop ブロックが全エンドポイントに波及
- SQLite pragma 追加は即効性あり（特に busy_timeout, cache_size）
- 抜本的解決には非同期 SQLite ドライバ（sql.js 等）への移行 or クエリ結果キャッシュが必要
- sessionStore と SSR キャッシュの無限成長も長時間稼働で問題になる
