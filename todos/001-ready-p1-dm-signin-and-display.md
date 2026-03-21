---
status: ready
priority: p1
issue_id: "001"
tags: [e2e, dm, auth, login]
dependencies: []
---

# DM サインイン・表示関連の E2E 失敗

## Problem Statement

DM関連のE2Eテスト7件が失敗。サインイン後のサイドバー表示、DM一覧の表示、タイトル設定などが正しく動作していない。

## Findings

失敗テスト:
- `dm.test.ts:10` — サインイン済みの場合、サイドバーにDMのリンクが表示されること
- `dm.test.ts:16` — 未サインインの場合、DMのリンクが表示されないこと
- `dm.test.ts:28` — DM一覧が表示される
- `dm.test.ts:38` — タイトルが「ダイレクトメッセージ - CaX」となること
- `dm.test.ts:44` — DM一覧が最後にやり取りをした順にソートされる
- `dm.test.ts:223` — タイトルが「{相手のユーザー名} さんとのダイレクトメッセージ - CaX」となること

共通パターン: サインイン処理（utils.ts の `login` 関数）が失敗しているか、DM一覧の表示ロジックに問題がある可能性。

## Acceptance Criteria

- [ ] DM関連の全E2Eテスト（21件）がパスする
- [ ] `login()` ユーティリティが安定して動作する
