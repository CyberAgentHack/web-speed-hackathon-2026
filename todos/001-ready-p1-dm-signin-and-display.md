---
status: done
priority: p1
issue_id: "001"
tags: [e2e, dm, auth, login]
dependencies: []
---

# DM サインイン・表示関連の E2E 失敗

## Problem Statement

DM関連のE2Eテスト7件が失敗。サインイン後のサイドバー表示、DM一覧の表示、タイトル設定などが正しく動作していない。

## Root Cause

1. `/dm`, `/crok` が SSR 対象外 → CSR フォールバック → `createRoot(#app)` → React が `<head>` を管理しない
2. React 19 の `<title>` 要素は「simple use cases」向け（公式ブログ）。lazy コンポーネント内の state 駆動更新では `document.title` に反映されない

## Resolution

1. `ssr.ts`: `planSSRFetches` catch-all を `return null` → `return {}` に変更（Empty Shell SSR）
2. `entry-server.tsx`: `computeTitle()` に `/dm/:conversationId` のフォールバックタイトルを追加
3. `DirectMessageContainer.tsx`: React `<title>` 要素 → `useEffect` + `document.title`（React 公式推奨パターン）
4. VRT スナップショット更新（SSR 化によるページ高さ変化）

## Acceptance Criteria

- [x] DM関連の全E2Eテスト（22件）がパスする
- [x] `login()` ユーティリティが安定して動作する
