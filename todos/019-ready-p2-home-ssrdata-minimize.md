---
status: ready
priority: p2
issue_id: "019"
tags: [perf, home, fcp, ssr, html-size]
dependencies: []
---

# `__SSR_DATA__` インラインの最小化

## Problem Statement

SSR HTML に `window.__SSR_DATA__` として 27KB のJSONがインラインされている。投稿データの不要フィールド（プロフィール詳細、全コメント等）が含まれており、HTMLパース負荷を増やしている。

## Findings

- `__SSR_DATA__` サイズ: 27KB（30投稿分）
- 投稿数削減（016）と併用すれば効果増
- SSR HTML 151KB のうち約18%が `__SSR_DATA__`
- クライアントの SWR fallbackData として使用

## Proposed Solutions

### A: 不要フィールドの除去
- サーバー側で SSR_DATA に渡す前に投稿データをstrip
- 例: `comments`, `user.profileImage` 詳細、`movie`/`sound` の生データ等を除外
- クライアントは SWR revalidate で完全データを取得
- **工数:** 中

### B: SSR_DATA を別リクエストに分離
- `<script src="/api/v1/ssr-data?path=/">` として外部化
- HTML パースをブロックしない
- **工数:** 中（キャッシュ戦略が複雑化）

## Recommended Action

A — 016（投稿数削減）と併用。不要フィールドを strip して HTML を軽くする。

## Acceptance Criteria

- [ ] `__SSR_DATA__` が 15KB 以下になる
- [ ] SSR → hydration → SWR revalidate のフローが正常動作
- [ ] 画面表示に必要な情報（テキスト、画像URL、ユーザー名）は維持

## Work Log

### 2026-03-21 - 作成

**By:** Claude Code

**Actions:**
- SSR_DATA 27KB の内訳を確認
