---
status: ready
priority: p1
issue_id: "013"
tags: [client, performance, tbt, post-photo]
dependencies: []
---

# TBT 修正: post_photo 636ms（他ページは 14-76ms）

## Problem Statement

post_photo ページのみ TBT が **636ms** と突出。他ページは 14-76ms 範囲。post_photo のスコアは **41**（最低スコア）。

## Findings

TBT 636ms = メインスレッドが長時間ブロックされている。原因候補：
- 写真投稿ページで ImageMagick WASM の初期化が同期的に走っている
- 複数画像の同時デコード・レンダリング
- 大量の DOM 操作

## Proposed Solutions

1. ImageMagick WASM の遅延初期化（ユーザー操作時のみ）
2. 画像処理を Web Worker に移動
3. `requestIdleCallback` でメインスレッド解放

**Effort:** 1-2 時間
**Risk:** Low-Medium

## Recommended Action

post_photo ページの Chrome Performance トレースを取り、Long Task の原因を特定してから修正。

## Acceptance Criteria

- [ ] post_photo の TBT が 200ms 以下
- [ ] post_photo の Lighthouse スコアが 60 以上
- [ ] VRT テスト全パス

## Work Log

### 2026-03-20 - ベンチマーク結果から問題特定

**By:** Claude Code

**Actions:**
- Lighthouse 計測で post_photo の TBT=636ms を確認
- 他ページとの差異から WASM 初期化が原因と推定
