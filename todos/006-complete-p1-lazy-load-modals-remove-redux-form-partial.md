---
status: done
priority: p1
issue_id: "006"
tags: [webpack, performance, code-splitting, redux-form]
dependencies: []
---

# AuthModal / NewPostModal の lazy 化 (redux-form をvendorsから除外)

## Problem Statement

`AuthModalContainer` と `NewPostModalContainer` は `AppContainer.tsx` で静的 import のまま残っている。これらが redux-form (60KB) + lodash 部分 (30KB) を vendors.js に引き込んでいる。

## Findings

- vendors.js (322KB) のうち redux-form 関連が約 90KB
- AuthModal は認証ボタン押下時のみ表示
- NewPostModal は投稿ボタン押下時のみ表示
- どちらもユーザー操作起点なので lazy で問題ない

## Proposed Solutions

### Option A: React.lazy で両モーダルを lazy 化

```tsx
const AuthModalContainer = lazy(() =>
  import("./AuthModalContainer").then(m => ({ default: m.AuthModalContainer }))
);
const NewPostModalContainer = lazy(() =>
  import("./NewPostModalContainer").then(m => ({ default: m.NewPostModalContainer }))
);
```

- **Pros:** vendors.js から redux-form + lodash が除外 (~90KB 削減)
- **Cons:** モーダル初回表示時に一瞬のロード
- **Effort:** 極小
- **Risk:** 低

## Recommended Action

Option A を実装。

## Acceptance Criteria

- [ ] AuthModalContainer が lazy import されている
- [ ] NewPostModalContainer が lazy import されている
- [ ] redux-form が vendors.js に含まれていない
- [ ] vendors.js が ~230KB 以下になっている
- [ ] モーダルの開閉が正常に動作する
- [ ] VRT が通ること

## Work Log

### 2026-03-20 - Initial Analysis

**By:** Claude Code

**Actions:**
- vendors.js の内訳分析で redux-form が ~90KB を占めることを確認
- AuthModal / NewPostModal が AppContainer.tsx で static import であることを確認
