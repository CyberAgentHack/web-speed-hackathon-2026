---
status: ready
priority: p2
issue_id: "036"
tags: [performance, ssr, api, double-fetch]
dependencies: []
---

# SSR データの二重取得を解消する

## Problem Statement

トレースで `GET /api/v1/posts?limit=30&offset=0` が @462ms に発行されている。SSR で `window.__SSR_DATA__` にデータを埋め込んでいるはずだが、クライアント側で再度 API を呼んでいる。これにより不要な API 呼び出しと 27KB の追加転送が発生している。

## Findings

- **トレースデータ:**
  - `/api/v1/posts?limit=30&offset=0`: @462ms, TTFB=7ms, 27.0KB
  - `/api/v1/me`: @136ms, 401応答（未認証）
- **SSR の現状:**
  - `window.__SSR_DATA__` で posts を SSR 時に埋め込み済み
  - クライアントの `useFetch` / `useInfiniteFetch` が SSR データを無視して再取得している可能性
  - または hydration 時に初期データとして利用されていない

## Proposed Solutions

### Option 1: useFetch の初期データ参照を修正

**Approach:** `useFetch` フック内で `window.__SSR_DATA__` の該当データが存在する場合は API 呼び出しをスキップし、そのデータを返す。

**Pros:**
- 初期ロード時の API 呼び出し 1件削減
- 27KB の転送量削減
- サーバー負荷軽減

**Cons:**
- SSR データの型安全性確認が必要
- CSR フォールバック時の挙動に注意

**Effort:** 1-2 hours

**Risk:** Low

---

### Option 2: React Server Components / Streaming SSR 連携

**Approach:** React 19 の SSR ストリーミングと連携し、データ取得を完全にサーバーサイドで完結させる。

**Pros:**
- クライアントの fetch 完全不要
- 最適なアーキテクチャ

**Cons:**
- 大規模リファクタ
- 既存の useFetch/useInfiniteFetch の書き換え

**Effort:** 8+ hours

**Risk:** High

## Recommended Action

Option 1 を実施。`useFetch` の初期データ参照ロジックを確認・修正し、SSR データが存在する場合の二重取得を防止する。

## Technical Details

**調査対象ファイル:**
- `application/client/src/hooks/useFetch.ts` — fetch フックの初期データ処理
- `application/client/src/hooks/useInfiniteFetch.ts` — ページネーション fetch
- `application/client/src/pages/TimelineContainer.tsx` — home ページのデータ取得
- `application/server/src/ssr/` — SSR データ埋め込み処理

## Acceptance Criteria

- [ ] SSR データが存在する場合、クライアントから `/api/v1/posts` が再取得されないこと
- [ ] トレースで初期ロード時の API 呼び出しが削減されること
- [ ] CSR フォールバック時は正常に API 取得が行われること
- [ ] VRT テストが通ること

## Work Log

### 2026-03-20 - トレース分析で発見

**By:** Claude Code

**Actions:**
- トレースの ResourceSendRequest イベントから API 呼び出しタイミングを確認
- posts API が @462ms に呼ばれており SSR データとの二重取得を確認
- SSR アーキテクチャ（window.__SSR_DATA__）との矛盾を特定

**Learnings:**
- SSR データ埋め込み自体は実装済みだが、クライアント側の fetch がそれを参照していない
- TTFB=7ms なので API 自体は高速だが、不要な呼び出しは無駄
