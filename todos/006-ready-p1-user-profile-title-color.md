---
status: complete
priority: p1
issue_id: "006"
tags: [e2e, user-profile, color-extraction]
dependencies: []
---

# ユーザー詳細 — タイトル・色抽出

## Problem Statement

ユーザー詳細ページのE2Eテスト2件が失敗。

## Findings

失敗テスト:
- `user-profile.test.ts:10` — タイトルが「{ユーザー名} さんのタイムライン - CaX」
- `user-profile.test.ts:17` — ページ上部がユーザーサムネイル画像の色を抽出した色になっている
  - `bgColor` が `oklch(...)` を返し、テストは `/^rgb/` を期待
  - Tailwind v4 の色がoklch形式で出力されている

## Proposed Solutions

色抽出テスト:
1. CSSの `backgroundColor` をrgb形式に変換して比較する
2. テスト側の期待値を `oklch` 対応にする
3. 色抽出ライブラリの出力をrgb形式に固定する

## Acceptance Criteria

- [ ] user-profile.test.ts の全テストがパスする
