---
status: done
priority: p2
issue_id: "016"
tags: [client, cleanup, bundle, dependencies]
dependencies: []
---

# 未使用依存パッケージの削除

## Problem Statement

jQuery, moment, lodash, bluebird, core-js, regenerator-runtime がソースから import 削除済みだが **package.json に残存**。tree shaking で消えているはずだが、バンドルに残留している可能性あり。

## Findings

**package.json に残存、ソースで import なし:**
- jquery v3.7.1
- jquery-binarytransport v1.0.0
- moment v2.30.1
- lodash v4.17.21
- bluebird v3.7.2
- core-js v3.45.1
- regenerator-runtime v0.14.1

**ソースで使用中（削除不可）:**
- redux-form: 10 ファイルで使用中

## Recommended Action

1. `pnpm remove jquery jquery-binarytransport moment lodash bluebird core-js regenerator-runtime`
2. ビルドが通ることを確認
3. バンドルサイズの変化を計測

## Acceptance Criteria

- [ ] 上記パッケージが package.json から削除
- [ ] `pnpm build` が成功
- [ ] VRT テスト全パス
