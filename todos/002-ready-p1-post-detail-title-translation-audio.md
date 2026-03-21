---
status: ready
priority: p1
issue_id: "002"
tags: [e2e, post-detail, translation, audio, alt]
dependencies: []
---

# 投稿詳細 — タイトル・翻訳・音声再生・ALTダイアログ

## Problem Statement

投稿詳細ページのE2Eテスト4件が失敗。

## Findings

失敗テスト:
- `post-detail.test.ts:27` — タイトルが「{ユーザー名} さんのつぶやき - CaX」
  - 投稿クリック後 `waitForURL("**/posts/*")` でタイムアウトか、タイトル未設定
- `post-detail.test.ts:37` — Show Translation → Show Original の切り替え
- `post-detail.test.ts:199` — 音声の再生位置が波形で表示されること
  - `data-sound-area` に svg（波形）が出現しない可能性
- `post-detail.test.ts:271` — ALTボタン → `dialog[open]` が表示されない
  - `command`/`commandfor` 属性による `showModal` が動作していない可能性

## Acceptance Criteria

- [ ] 投稿詳細の全E2Eテスト（9件）がパスする
