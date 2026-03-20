---
status: ready
priority: p1
issue_id: "018"
tags: [e2e, vite, code-splitting, lazy-loading, dm]
dependencies: []
---

# login() lazy chunk race condition

## Problem Statement

E2E テストの `login()` ユーティリティが、Vite のコード分割により `AuthModalContainer` の lazy chunk がロード完了する前にサインインボタンをクリックしてしまい、ダイアログが開かない。10件のテストが同一原因で失敗。

影響テスト:
- crok-chat (2): サジェスト候補, AI応答
- dm (6): 全DMテスト
- posting (2): テキスト投稿, 画像投稿

## Findings

- `login()` は `waitUntil: "domcontentloaded"` でページ遷移するが、lazy chunk のロード完了を待たない
- サインインボタンは HTML Invoker Commands API (`command="show-modal"`, `commandfor`) を使用
- `commandfor` は対象の `<dialog>` が DOM に存在する必要がある
- `auth.test.ts` は `waitUntil: "networkidle"` を使用しており pass している
- Webpack 時代は `splitChunks: false` で全コードが 1 ファイルだったため問題が顕在化しなかった

## Proposed Solutions

### A. `login()` の `waitUntil` を `networkidle` に変更（推奨）

`e2e/src/utils.ts` の `login()` で `waitUntil: "networkidle"` に変更。auth.test.ts と同じパターン。

- Effort: 1行変更
- Risk: 低
- Pros: 最小変更、auth.test.ts で実績あり
- Cons: `networkidle` はテスト速度がやや遅くなる

### B. `AuthModalContainer` を eager import に変更

`AppContainer.tsx` で `lazy()` を外して直接 import。

- Effort: 小（import 変更 + rebuild）
- Risk: 低（chunk サイズ ~3.8KB）
- Pros: UX バグ（ボタンクリック無効）も解消、テスト変更不要
- Cons: 初期バンドルサイズ微増

### C. dialog 出現待ちをテストに追加

`login()` でクリック前に `page.locator("dialog").waitFor()` を追加。

- Effort: 小
- Risk: 低
- Pros: 根本原因に近い対処
- Cons: テストコードが冗長

## Recommended Action

**A + B の組み合わせ。** テスト側は A で即修正、アプリ側は B で UX バグも解消。

## Acceptance Criteria

- [ ] `login()` を使う全テスト (crok-chat, dm, posting) が pass する
- [ ] `auth.test.ts` が引き続き pass する
- [ ] `AuthModalContainer` が eager import で即座に DOM に存在する

## Work Log

### 2026-03-20 - 初期調査

**By:** Claude Code

**Actions:**
- E2E テスト実行、14件の失敗を確認
- error-context.md から 404 ページのスナップショットを分析
- `login()` → `commandfor` → lazy chunk の因果関係を特定
- auth.test.ts の `networkidle` パターンとの差異を確認

**Learnings:**
- Vite code splitting と HTML Invoker Commands API の組み合わせは timing 問題を起こしやすい
- `waitUntil: "domcontentloaded"` vs `"networkidle"` の違いが lazy chunk の有無で致命的になる

### 2026-03-20 - フルテスト実行で追加確認

**By:** Claude Code

**Actions:**
- 54テスト全実行（`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 設定で nix Chromium 使用）
- 27テスト失敗を確認、DM系は `disabled` ボタンの click タイムアウト (30s) が主因
- エラーパターン: `element is not enabled` → `pressSequentially()` 後のバリデーション未完了
- retry #1 では Crok リンク `waitFor({ timeout: 3_000 })` で失敗（ログイン自体未成功）

**Learnings:**
- 前回分析の lazy chunk 問題に加え、フォームバリデーション非同期問題も発見
- `pressSequentially()` は入力完了後のバリデーション完了を保証しない
