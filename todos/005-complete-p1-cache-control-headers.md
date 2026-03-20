---
status: ready
priority: p1
issue_id: "005"
tags: [server, performance, caching, headers]
dependencies: []
---

# Cache-Control ヘッダー最適化

## Problem Statement

現在 `Cache-Control: no-store` が全レスポンスに設定されている。contenthash 付きの静的アセットも毎回再ダウンロードされ、再訪問時のパフォーマンスが著しく悪い。

## Findings

- サーバーのミドルウェアで全レスポンスに `Cache-Control: no-store` を設定 (CLAUDE.md 記載)
- ビルド出力は `[name].[contenthash].js` 形式 → immutable キャッシュに最適
- ETags / Last-Modified も無効化されている

## Proposed Solutions

### Option A: 静的アセットに immutable キャッシュ、API は no-cache

- `/dist/scripts/`, `/dist/styles/` → `Cache-Control: public, max-age=31536000, immutable`
- `/api/` → `Cache-Control: no-cache` or `no-store`
- `/dist/index.html` → `Cache-Control: no-cache` (常に最新を返す)

- **Pros:** 再訪問で JS/CSS のダウンロードが不要に。contenthash でキャッシュバスト保証
- **Cons:** なし (contenthash があるので安全)
- **Effort:** 小
- **Risk:** 低

## Recommended Action

Option A を実装。Express の静的ファイル配信ミドルウェアに `maxAge` と `immutable` を設定。

## Acceptance Criteria

- [ ] contenthash 付きアセット (JS/CSS) に `max-age=31536000, immutable` が設定
- [ ] `index.html` は `no-cache` または短い max-age
- [ ] API レスポンスはキャッシュされない
- [ ] VRT が通ること

## Work Log

### 2026-03-20 - Initial Analysis

**By:** Claude Code

**Actions:**
- CLAUDE.md のボトルネック記載を確認: `Cache-Control: max-age=0`, ETags無効

**Learnings:**
- contenthash 付きファイルの immutable キャッシュは安全で効果が大きい
