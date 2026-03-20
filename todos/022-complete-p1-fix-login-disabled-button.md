---
status: ready
priority: p1
issue_id: "022"
tags: [e2e, form, validation, login]
dependencies: []
---

# login() でサインインボタンが disabled のまま（3テスト失敗）

## Problem Statement

E2E の `login()` ユーティリティで `pressSequentially()` 入力後にサインインボタンが `disabled` のまま 30s タイムアウトする。フォームバリデーションが入力イベントに追いつかない。

失敗テスト: dm:155, dm:178, posting:40（flaky: posting:13, crok-chat:13,40, dm:132）

## Findings

- `pressSequentially()` で入力 → ボタンは `disabled` のまま → 30s timeout
- retry #1 ではボタンクリック成功するケースあり（flaky）
- SSR hydration 修正後も残存 → hydration 派生ではなくフォームバリデーション自体の問題
- `auth.test.ts` は全 pass → `auth.test.ts` は `/not-found` に `networkidle` で遷移してからモーダルを開く

## Proposed Solutions

### A. `login()` でボタン enabled 待ちを追加（推奨）

```ts
await page.getByRole("button", { name: "サインイン" }).last().waitFor({ state: "visible" });
await expect(page.getByRole("button", { name: "サインイン" }).last()).toBeEnabled({ timeout: 5_000 });
await page.getByRole("button", { name: "サインイン" }).last().click();
```

### B. `login()` の goto を `networkidle` に変更

auth.test.ts と同じパターン。テスト速度やや低下。

## Recommended Action

**A.** ボタン enabled 待ちを追加。

## Acceptance Criteria

- [ ] dm:155, dm:178, posting:40 が pass
- [ ] flaky テスト (posting:13, crok-chat, dm:132) が安定化

## Work Log

### 2026-03-20 - 分析

**By:** Claude Code

**Actions:**
- フルテスト結果から login disabled パターンを特定
- auth.test.ts との差異（networkidle vs domcontentloaded）を確認
