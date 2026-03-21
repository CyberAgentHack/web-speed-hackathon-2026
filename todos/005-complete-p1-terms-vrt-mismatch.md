---
status: complete
priority: p1
issue_id: "005"
tags: [e2e, terms, vrt, font]
dependencies: []
---

# 利用規約 — VRTスナップショット不一致

## Problem Statement

利用規約ページのVRTテスト2件が失敗。

## Findings

失敗テスト:
- `terms.test.ts:15` — ページが正しく表示されている
- `terms.test.ts:26` — フォントの表示が初期仕様と同じ見た目になっていること

`terms-利用規約-フォント` スナップショットはupstream生成に含まれていないため古いままの可能性。
また terms ページ自体のレイアウトやフォント適用が upstream と異なる可能性。

## Acceptance Criteria

- [ ] terms.test.ts の全3件がパスする
