---
status: ready
priority: p2
issue_id: "019"
tags: [e2e, tailwind-v4, css, migration]
dependencies: []
---

# user-profile 背景色が oklch() で返り rgb テストが失敗

## Problem Statement

`user-profile.test.ts:17` で `getComputedStyle().backgroundColor` が `oklch(0.985 0.001 106.423)` を返すが、テストは `/^rgb/` を期待して失敗。

## Findings

- `fast-average-color` が `rgb(...)` を返す
- `UserProfileHeader.tsx` が Tailwind arbitrary value `bg-[${averageColor}]` で適用
- Tailwind v4.2.1 が内部で全色を `oklch()` に変換
- `getComputedStyle` は Tailwind の出力値（`oklch`）を返す
- SSR 無関係。Tailwind v3→v4 移行の問題

## Proposed Solutions

### A. テストの regex を更新（クイックフィックス）

```ts
expect(bgColor).toMatch(/^(rgb|oklch)\(/);
```

- Effort: 1行
- Risk: なし
- Cons: 根本原因（Tailwind 経由の色変換）は残る

### B. inline style に変更（推奨）

```tsx
style={averageColor ? { backgroundColor: averageColor } : undefined}
```

- Effort: `UserProfileHeader.tsx` 1箇所
- Risk: なし
- Pros: ランタイム動的値に inline style は正しいパターン、テスト変更不要

## Recommended Action

**B.** inline style で Tailwind の色変換をバイパス。

## Acceptance Criteria

- [ ] `user-profile.test.ts:17` が pass する
- [ ] ページ上部に画像から抽出した色が正しく表示される

## Work Log

### 2026-03-20 - 初期調査

**By:** Claude Code

**Actions:**
- エラーメッセージ `oklch(0.985 0.001 106.423)` vs `/^rgb/` を確認
- `UserProfileHeader.tsx` の色適用ロジックを特定
- Tailwind v4 の oklch 変換仕様を確認

**Learnings:**
- Tailwind v4 は arbitrary values の色も oklch に変換する
- ランタイム動的値は inline style で適用すべき
