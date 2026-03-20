---
status: ready
priority: p1
issue_id: "023"
tags: [e2e, spa, navigation, timeout]
dependencies: []
---

# SPA クライアントルーティングで waitForURL が 3s タイムアウト（3テスト失敗）

## Problem Statement

ホームで article をクリック → `waitForURL("**/posts/*", { timeout: 3_000 })` で遷移待ちが 3s タイムアウト。SPA のクライアントサイドルーティングで `load` イベントが発火しないか遅い。

失敗テスト: home:58, post-detail:10, post-detail:27

## Findings

- `article.click()` 後に `waitForURL` が `load` イベントを待つ（Playwright デフォルト）
- SPA ナビゲーションは実際のページロードではないため `load` イベントが発火しない場合がある
- または初期コミット (108MB JS) と異なり、現在のコードではナビゲーションが非同期処理を含む

## Proposed Solutions

### A. `waitForURL` の waitUntil を `commit` に変更（推奨）

```ts
await page.waitForURL("**/posts/*", { timeout: 3_000, waitUntil: "commit" });
```

### B. `waitForURL` の代わりに URL パターンを直接待つ

```ts
await page.waitForFunction(() => window.location.pathname.startsWith('/posts/'), { timeout: 5_000 });
```

### C. timeout を増やす

```ts
await page.waitForURL("**/posts/*", { timeout: 10_000 });
```

## Recommended Action

**A.** `waitUntil: "commit"` で SPA ナビゲーション完了を検知。

## Acceptance Criteria

- [ ] home:58 投稿クリック遷移が pass
- [ ] post-detail:10 投稿表示が pass
- [ ] post-detail:27 タイトル検証が pass

## Work Log

### 2026-03-20 - 分析

**By:** Claude Code

**Actions:**
- `waitForURL` のログ `waiting for navigation to "**/posts/*" until "load"` を確認
- SPA ナビゲーションでは load イベントが不適切であることを特定
