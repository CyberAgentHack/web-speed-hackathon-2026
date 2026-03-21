---
status: complete
priority: p1
issue_id: "004"
tags: [e2e, search, validation]
dependencies: []
---

# 検索ページ — バリデーション・検索結果

## Problem Statement

検索ページのE2Eテスト2件が失敗。

## Root Cause

- `search.test.ts:52` — redux-form 8.3.10 + React 19.2.0 互換性問題。初期レンダー時に `syncErrors` が Redux store に反映されず、`handleSubmit` が空フォームの submit をブロックしない。
- `search.test.ts:94` — VRT スナップショットが古い（自動生成後にソート順・動画レンダリング等が変更された）

## Fix

- `:52`: `SearchPage.tsx` の `onSubmit` 内で `validate` を手動実行し、エラー時に `SubmissionError` を throw（redux-form の標準イディオム、`AuthModalContainer.tsx` と同パターン）
- `:94`: VRT スナップショットを `--update-snapshots` で再生成

## Acceptance Criteria

- [x] 検索ページの全E2Eテスト（17件）がパスする
