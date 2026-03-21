---
status: ready
priority: p1
issue_id: "016"
tags: [scoring, perf, tbt, terms, websocket]
dependencies: []
---

# 利用規約ページ TBT=0点 (30点満点)

## Problem Statement

利用規約ページ (`/terms`) の TBT (Total Blocking Time) スコアが 0.00/30。
ページ自体は静的コンテンツだが、共通コンポーネントの初期化処理がメインスレッドをブロックしている。

## Findings

- `TermContainer.tsx` — 11行の超シンプルなコンポーネント（静的HTML表示のみ）
- `TermPage.tsx` — 248行の純粋な HTML/CSS。API呼出・状態管理なし
- **WebSocket 接続が全ページで発火:** `DirectMessageNotificationBadge.tsx` が Navigation 内で常にレンダリング → `useWs("/api/v1/dm/unread")` が mount 時に即接続
- **SWR revalidation:** `AppContainer.tsx` が `useSWR("/api/v1/me")` を全ページで実行
- **React hydration:** 全コンポーネントツリーの同期的 hydration
- Lighthouse TBT=0 は通常 600-800ms 以上のブロッキング時間を意味

## Proposed Solutions

### Option 1: WebSocket を条件付きで初期化

**Approach:** `DirectMessageNotificationBadge` 内で `useLocation()` を使い、`/terms` 等の静的ページでは WebSocket を接続しない。

**Pros:**
- 最小変更
- 他ページへの影響なし

**Cons:**
- ページ追加時にリスト更新が必要

**Effort:** 10分
**Risk:** Low

### Option 2: WebSocket を requestIdleCallback で遅延

**Approach:** `useWs` hook 内で `requestIdleCallback` を使い、ページ描画完了後に接続。

**Pros:**
- 全ページの TBT 改善
- ページリスト管理不要

**Cons:**
- 未読バッジの表示が僅かに遅れる

**Effort:** 15分
**Risk:** Low

### Option 3: Option 1 + 2 の併用

**Approach:** 静的ページでは完全スキップ、それ以外では idle 時に遅延初期化。

**Effort:** 20分
**Risk:** Low

## Recommended Action

Option 3 を採用。/terms, /crok 等の認証不要ページでは WebSocket スキップ + その他ページでは idle callback で遅延。

## Technical Details

**Affected files:**
- `application/client/src/components/direct_message/DirectMessageNotificationBadge.tsx`
- `application/client/src/hooks/use_ws.ts`
- `application/client/src/containers/AppContainer.tsx` — SWR revalidateOnMount 制御

## Acceptance Criteria

- [ ] /terms ページの TBT が 200ms 以下
- [ ] scoring-tool で利用規約ページの TBT スコアが 15点以上
- [ ] 他ページの DM 未読バッジが引き続き動作
- [ ] VRT が壊れないこと

## Work Log

### 2026-03-21 - 初回分析

**By:** Claude Code

**Actions:**
- TermContainer/TermPage のコード確認（純粋な静的コンテンツ）
- DirectMessageNotificationBadge の WebSocket 接続が全ページで発火していることを確認
- AppContainer の useSWR("/api/v1/me") が全ページで revalidation していることを確認
