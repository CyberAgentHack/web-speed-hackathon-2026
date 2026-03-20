---
status: ready
priority: p1
issue_id: "001"
tags: [webpack, performance, code-splitting, react]
dependencies: []
---

# Route-Based Code Splitting

## Problem Statement

`AppContainer.tsx` で全8ルート (TimelineContainer, CrokContainer, DirectMessageContainer 等) を静的 import している。ユーザーが `/` にアクセスしただけで全ルートのコードが `main.js` (236KB) に含まれてしまい、初期ロード時に不要なコードまでダウンロード・パースされる。

## Findings

- `application/client/src/containers/AppContainer.tsx` で 8 つの Container を全て静的 import
- 現状 `React.lazy()` はルートレベルでは一切使われていない（CodeBlock.tsx のみ）
- 初期ロード: `vendors.js` (1.1MB) + `main.js` (236KB) = **1.3MB** がブロッキング

## Proposed Solutions

### Option A: React.lazy + Suspense (推奨)

各ルート Container を `React.lazy(() => import('./XxxContainer'))` に置換し `<Suspense>` で囲む。

- **Pros:** 最小変更、webpack が自動でチャンク分割
- **Cons:** ローディング表示が一瞬出る
- **Effort:** 小 (30分)
- **Risk:** 低

### Option B: @loadable/component

SSR 対応のコード分割ライブラリ。

- **Pros:** SSR 対応可
- **Cons:** 追加依存、現状 CSR only なのでオーバースペック
- **Effort:** 中
- **Risk:** 低

## Recommended Action

Option A を採用。`AppContainer.tsx` の静的 import を `React.lazy` に変更する。

対象コンテナ:
- `TimelineContainer`
- `DirectMessageListContainer`
- `DirectMessageContainer`
- `SearchContainer`
- `UserProfileContainer`
- `PostContainer`
- `TermContainer`
- `CrokContainer`
- `NotFoundContainer`

## Acceptance Criteria

- [ ] 全ルート Container が `React.lazy()` で読み込まれている
- [ ] `<Suspense fallback>` が設定されている
- [ ] ビルド後に各ルート用のチャンクファイルが生成されている
- [ ] 初期ロード (main.js) のサイズが削減されている
- [ ] VRT が通ること
- [ ] 手動テストで各ルート遷移が正常に動作すること

## Work Log

### 2026-03-20 - Initial Analysis

**By:** Claude Code

**Actions:**
- `AppContainer.tsx` を読み、全ルートが静的 import であることを確認
- ビルド出力を確認: main.js 236KB, vendors.js 1.1MB が initial load

**Learnings:**
- ルート分割なしで全コードが1つの main chunk に入っている
- React.lazy は CodeBlock.tsx でのみ使用されており、パターンは既にコードベースに存在する
