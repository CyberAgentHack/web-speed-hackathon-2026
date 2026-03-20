---
status: ready
priority: p2
issue_id: "025"
tags: [e2e, image, lazy-loading]
dependencies: []
---

# post-detail 写真テストで naturalWidth=0（画像未ロード）

## Problem Statement

`post-detail.test.ts:104` で `coveredImage.evaluate(el => el.naturalWidth)` が 0 を返す。画像が表示されているが未デコード。

## Findings

- `object-fit: cover` のアサーションは pass（要素自体は表示されている）
- `naturalWidth` が 0 → 画像の `src` が未設定か、デコード未完了
- 遅延ロード (`loading="lazy"`) が viewport 内でもデコードを遅延している可能性
- または画像が data URL / blob URL で `naturalWidth` が取得できないケース

## Proposed Solutions

### A. 画像デコード完了を待つ

```ts
await coveredImage.evaluate((el: HTMLImageElement) => el.decode());
```

### B. テストで `waitForVisibleMedia` 後に naturalWidth を取得

テストコードで `waitForVisibleMedia(page)` を naturalWidth チェックの前に移動。

## Recommended Action

まず画像の src と loading 属性を調査。原因に応じて A or B。

## Acceptance Criteria

- [ ] post-detail:104 が pass
- [ ] naturalWidth > 100

## Work Log

### 2026-03-20 - 分類

**By:** Claude Code

**Actions:**
- エラー `Expected: > 100, Received: 0` を確認
