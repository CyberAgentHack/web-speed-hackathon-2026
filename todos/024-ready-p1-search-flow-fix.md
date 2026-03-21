---
status: ready
priority: p1
issue_id: "018"
tags: [scoring, search, user-flow, heading]
dependencies: ["015"]
---

# 検索フローテスト失敗 — 検索結果の表示

## Problem Statement

scoring-tool の検索ユーザーフローが「検索結果の表示に失敗しました」で失敗。
テストは malformed な日付入力 (`since:2026-01-0600000000000000000000x`) を行い、sanitize 後の heading `/「アニメ/` を待つ。

## Findings

- `calculate_search_post_flow_action.ts` — 入力: `"アニメ since:2026-01-06" + "0".repeat(20) + "x"`
- クライアント側 `sanitizeSearchText()` (`search/services.ts:1-6`) — `since:2026-01-0600000000000000000000x` → `since:2026-01-06` に正しく sanitize
- `SearchPage.tsx:110` — sanitize 後の値で `navigate(/search?q=...)` を実行
- `SearchPage.tsx:132-134` — `{searchConditionText} の検索結果 ({results.length} 件)` heading を表示
- heading は `{query && (...)}` で URL パラメータがあれば表示されるはず

**可能性のある原因:**
1. hydration 問題でフォーム送信が動作しない
2. SearchPage のレンダリングタイミング問題
3. サーバー側 parse との不整合で結果が返らない（ただし heading は結果0件でも表示される設計）

## Proposed Solutions

### Option 1: SearchPage のデバッグ

**Approach:** scoring-tool と同じ入力で手動テストし、heading 表示を確認。問題があればコンポーネントのレンダリング条件を修正。

**Effort:** 30分
**Risk:** Low

## Recommended Action

まず手動で同じフローを再現し、heading が表示されるか確認。
サインインモーダル修正 (015) が前提の場合は依存として扱う。

## Technical Details

**Affected files:**
- `application/client/src/components/application/SearchPage.tsx` — heading 表示
- `application/client/src/containers/SearchContainer.tsx` — データ取得
- `application/client/src/utils/search/services.ts` — sanitize ロジック

**scoring-tool の期待するセレクタ:**
- 検索入力: `getByRole("textbox", { name: "検索 (例: キーワード since:2025-01-01 until:2025-12-31)" })`
- 検索ボタン: `getByRole("button", { name: "検索" })`
- 結果 heading: `getByRole("heading", { name: /「アニメ/ })`

## Acceptance Criteria

- [ ] malformed 日付入力で検索しても heading が表示される
- [ ] scoring-tool の検索フローテストが pass
- [ ] 通常の検索機能に影響なし

## Work Log

### 2026-03-21 - 初回分析

**By:** Claude Code

**Actions:**
- scoring-tool の検索フローテストコード全文分析
- クライアント側の sanitize/表示ロジック確認
- サーバー側の parse_search_query.ts との不整合可能性を特定
