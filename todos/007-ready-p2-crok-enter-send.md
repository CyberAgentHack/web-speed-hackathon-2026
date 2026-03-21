---
status: ready
priority: p2
issue_id: "007"
tags: [e2e, crok, keyboard]
dependencies: []
---

# Crok AIチャット — Enter送信

## Problem Statement

CrokチャットのE2Eテスト1件が失敗。

## Findings

失敗テスト:
- `crok-chat.test.ts:180` — Enterでメッセージを送信、Shift+Enterで改行できること

キーボードイベント処理の問題。Enter で送信されないか、Shift+Enter で改行されない。

## Acceptance Criteria

- [ ] crok-chat.test.ts の全テストがパスする
