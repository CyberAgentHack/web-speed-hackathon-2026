---
status: ready
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

## Proposed Solutions

1. 画像のdecode完了を待ってからobjectFitを確認する
2. CoveredImage コンポーネントに明示的な `style` を設定する（Tailwind class だけでなく）
3. テスト側でリトライ/待機ロジックを追加する

## Acceptance Criteria

- [ ] objectFit チェックが安定してパスする
