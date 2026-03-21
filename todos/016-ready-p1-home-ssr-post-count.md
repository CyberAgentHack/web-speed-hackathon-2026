---
status: ready
priority: p1
issue_id: "016"
tags: [perf, home, fcp, ssr, html-size]
dependencies: []
---

# SSR 投稿数を 30 → 10 に削減

## Problem Statement

ホームのSSR HTMLが151KB（圧縮14.6KB）。30件の投稿をフル展開しているのが主因。HTMLパース時間がFCPを遅延させている。

## Findings

- SSR HTML: 151KB raw / 14.6KB compressed
- `__SSR_DATA__` インライン: 27KB（30件分のJSON）
- `/posts/` リンク60個（各投稿に2リンク）
- InfiniteScroll で追加読込可能なので初期表示は少なくても良い
- `TimelineContainer.tsx` の `PAGE_SIZE = 30`、SSR fetcher も `limit=30`

## Proposed Solutions

### A: SSR時のfetch数だけ減らす（サーバー側）
- `planSSRFetches` で `/api/v1/posts?limit=10` にする
- クライアント側 `PAGE_SIZE` はそのまま（追加読み込みは30件単位）
- **工数:** 低

### B: SSR + クライアント両方減らす
- `PAGE_SIZE = 10` に統一
- スクロール体験は変わるが一貫性あり
- **工数:** 低

## Recommended Action

A — SSRだけ10件にしてHTML削減。クライアントの追加読み込みは30件のまま。

## Acceptance Criteria

- [ ] SSR HTML サイズが 100KB 以下になる
- [ ] `__SSR_DATA__` のサイズが削減される
- [ ] InfiniteScroll による追加読み込みが正常動作
- [ ] VRT パス

## Work Log

### 2026-03-21 - 作成

**By:** Claude Code

**Actions:**
- HTML 151KB、SSR_DATA 27KB を計測
- TimelineContainer の PAGE_SIZE=30 と SSR fetcher を確認
