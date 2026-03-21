---
status: complete
priority: p2
issue_id: "008"
tags: [e2e, flaky, home, post-detail, image, object-fit]
dependencies: []
---

# Flaky — 写真の object-fit: cover

## Problem Statement

写真の `object-fit: cover` チェックが flaky（不安定）。

## Findings

flakyテスト:
- `home.test.ts:48` — 写真が枠を覆う形で拡縮している
- `post-detail.test.ts:243` — 写真がcover拡縮し、画像サイズが著しく荒くない

エラー: `expect(objectFit).toBe("cover")` で `""` を受け取る。
画像の読み込みタイミングにより、`getComputedStyle` の結果が空になることがある。

## Root Cause

`evaluate()` で DOM 要素を取得した後、React の hydration/re-render で要素が detach される。
detach された要素の `getComputedStyle()` は全プロパティ `""` を返す。

## Fix

テスト側で `evaluate()` + `getComputedStyle()` の手動パターンを
Playwright の `toHaveCSS()` (auto-retry assertion) に置き換え。
ロケータを毎回再解決するので detachment・CSS 遅延を自動ハンドリング。

```diff
- const objectFit = await coveredImage.evaluate((el) => {
-   return window.getComputedStyle(el).objectFit;
- });
- expect(objectFit).toBe("cover");
+ await expect(coveredImage).toHaveCSS("object-fit", "cover");
```

## Acceptance Criteria

- [x] objectFit チェックが安定してパスする（3回連続パス確認済）
