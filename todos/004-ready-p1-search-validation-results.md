---
status: ready
priority: p1
issue_id: "004"
tags: [e2e, search, validation]
dependencies: []
---

# 検索ページ — バリデーション・検索結果

## Problem Statement

検索ページのE2Eテスト2件が失敗。

## Findings

失敗テスト:
- `search.test.ts:52` — 空のまま検索するとエラーが表示される
  - バリデーションエラーメッセージの表示ロジックに問題がある可能性
- `search.test.ts:94` — 検索結果が表示される
  - 検索API呼び出しまたは結果表示に問題がある可能性

## Acceptance Criteria

- [ ] 検索ページの全E2Eテスト（14件）がパスする
