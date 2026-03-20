---
status: ready
priority: p2
issue_id: "007"
tags: [webpack, performance, react-router]
dependencies: []
---

# react-router の development chunk 混入確認

## Problem Statement

vendors.js に `react-router/dist/development/chunk-OIYGIGL5.mjs` (328KB) が含まれている。production ビルドなのに development チャンクが使われている可能性がある。

## Findings

- webpack stats で `react-router/dist/development/` パスのモジュールが確認された
- `mode: "production"` は設定済みだが、react-router が `process.env.NODE_ENV` ではなく別の条件で分岐している可能性

## Proposed Solutions

### Option A: resolve.alias で production パスを強制

```js
alias: {
  "react-router": path.resolve(__dirname, "node_modules/react-router/dist/production/..."),
}
```

### Option B: 原因調査のみ

react-router v7 のビルド分岐を確認し、development chunk が本当に含まれているか検証。

## Recommended Action

Option B で調査してから対策を決定。

## Acceptance Criteria

- [ ] react-router が production ビルドを使用していることを確認
- [ ] 不要なら development chunk を除外

## Work Log

### 2026-03-20 - Initial Analysis

**By:** Claude Code

**Actions:**
- webpack stats で react-router の development パスのモジュール (328KB) を確認
