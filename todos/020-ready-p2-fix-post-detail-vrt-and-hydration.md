---
status: ready
priority: p2
issue_id: "020"
tags: [e2e, ssr, hydration, vrt]
dependencies: []
---

# post-detail テスト失敗（VRT baseline 破損 + hydration 問題）

## Problem Statement

`post-detail.test.ts` の 2 テストが失敗:
1. **動画テスト (line 43):** VRT baseline が壊れている（空白ページが baseline）
2. **写真テスト (line 105):** `networkidle` でタイムラインが空になる（hydration 関連の可能性）

## Findings

### 動画テスト
- 実際のページは正しくレンダリングされている
- baseline スナップショットが空白ページ（sidebar のみ、main が空）
- baseline 再生成で解決

### 写真テスト
- `page.goto("/", { waitUntil: "networkidle" })` 時に `<main>` が空
- 他のテスト（`networkidle` なし）では正常にレンダリング
- SSR → hydration 時に `<Suspense fallback={null}>` + `React.lazy()` で一瞬コンテンツが消える可能性
- SSR ではコンテナを同期的にレンダリングするが、hydration 時は `lazy()` が Suspense をトリガー

## Proposed Solutions

### 動画テスト

VRT baseline 再生成:
```bash
npx playwright test src/post-detail.test.ts --update-snapshots -g "動画が自動再生され"
```

### 写真テスト

#### A. テストから `networkidle` を削除（クイックフィックス）

```diff
- await page.goto("/", { waitUntil: "networkidle" });
+ await page.goto("/");
+ await page.locator("article").first().waitFor({ timeout: 30_000 });
```

#### B. hydration の Suspense 問題を修正（根本対応）

SSR 対象ルートのコンテナは hydration 時に lazy chunk がロードされるまで Suspense fallback (null) に置き換わる。対策:
- entry-server.tsx で同期 import しているコンテナを entry-client.tsx でも eager import する
- または `<Suspense>` の fallback をスケルトン UI にする

## Recommended Action

動画: baseline 再生成。写真: まず A で即修正、B は SSR 最適化として別途対応。

## Acceptance Criteria

- [ ] `post-detail.test.ts:43` 動画テストが pass
- [ ] `post-detail.test.ts:105` 写真テストが pass
- [ ] 他の post-detail テスト (line 10, 27, 74) が引き続き pass

## Work Log

### 2026-03-20 - 初期調査

**By:** Claude Code

**Actions:**
- error-context.md を分析、動画テストの baseline が空白であることを確認
- 写真テストの空 main を確認、`networkidle` と非 `networkidle` テストの差異を特定
- SSR hydration と Suspense の相互作用を分析

**Learnings:**
- SSR で同期レンダリングしたコンテンツが hydration 時に lazy() で一瞬消える問題がある
- `networkidle` は hydration の中間状態をキャプチャしやすい

### 2026-03-20 - フルテスト実行で追加失敗確認

**By:** Claude Code

**Actions:**
- 54テスト全実行、以下の追加失敗を確認:
  - `home.test.ts:11` タイムライン表示 — VRT 不一致
  - `home.test.ts:48` 写真cover拡縮 — VRT 不一致
  - `home.test.ts:58` 投稿クリック遷移 — タイムアウト
  - `post-detail.test.ts:10` 投稿表示 — VRT 不一致
  - `post-detail.test.ts:27` タイトル検証 — タイムアウト
  - `post-detail.test.ts:104` 写真cover — VRT 不一致
  - `search.test.ts:36` テキスト検索 — タイムアウト

**Learnings:**
- SSR 導入後の baseline 不整合が広範囲に影響
- VRT baseline 全面再生成が最優先アクション
