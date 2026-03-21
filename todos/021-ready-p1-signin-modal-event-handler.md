---
status: ready
priority: p1
issue_id: "015"
tags: [scoring, auth, modal, dialog, command-api]
dependencies: []
---

# サインインモーダルのイベントハンドラ欠落 (~550点影響)

## Problem Statement

scoring-tool の全ユーザーフローテスト + DM ページ計測が「サインインモーダルの表示に失敗しました」で失敗する。
ボタンに `command="show-modal"` `commandfor="auth-modal"` が設定されているが、クリック時に `dialog.showModal()` を呼ぶ JS が存在しない。

## Findings

- `NavigationItem.tsx:35-46` — ボタンが `command="show-modal"` `commandfor="auth-modal"` を出力
- `Navigation.tsx:52-58` — サインインボタンが NavigationItem を使用
- `AuthModalContainer.tsx:85-92` — `<dialog id="auth-modal">` は DOM に存在するが `showModal()` 未呼出
- `Modal.tsx` — dialog 要素のラッパー。外部から showModal を呼ぶ仕組みがない
- scoring-tool `calculate_user_auth_flow_action.ts:40-47` — `getByRole("button", { name: "サインイン" })` → click → `getByRole("dialog")` heading 待ち

**注:** `command`/`commandfor` は HTML の Invoker Commands API (Chrome 114+) だが、Puppeteer/Playwright の自動化環境で動作しない可能性がある。ポリフィルまたは明示的な JS ハンドラが必要。

## Proposed Solutions

### Option 1: onClick ハンドラで showModal() 呼出

**Approach:** NavigationItem の button に onClick を追加し、commandfor の ID で dialog を取得して showModal() を呼ぶ。

**Pros:**
- 最小変更で確実に動作
- ブラウザ互換性の心配なし

**Cons:**
- Invoker Commands API との二重実行リスク（対応ブラウザで）

**Effort:** 15分
**Risk:** Low

### Option 2: グローバルイベントリスナーで command 属性を処理

**Approach:** entry-client.tsx にグローバル click リスナーを追加し、`command="show-modal"` のボタンを汎用的に処理。

**Pros:**
- 全 command ボタンを一括対応
- コンポーネント個別修正不要

**Cons:**
- グローバルリスナーの管理コスト

**Effort:** 20分
**Risk:** Low

## Recommended Action

Option 1 を採用。NavigationItem または AuthModalContainer レベルで onClick → `document.getElementById(commandfor).showModal()` を実装。
DM ページの DirectMessageGate 内のサインインボタンも同様に対応が必要。

## Technical Details

**Affected files:**
- `application/client/src/components/application/NavigationItem.tsx` — onClick 追加
- `application/client/src/components/direct_message/DirectMessageGate.tsx` — サインインボタン
- `application/client/src/components/modal/Modal.tsx` — showModal メソッド公開

**scoring-tool が期待するフロー:**
1. `getByRole("button", { name: "サインイン" })` → click
2. `getByRole("dialog")` → `getByRole("heading", { name: "サインイン" })` が 10s 以内に表示

## Acceptance Criteria

- [ ] サインインボタン click で auth-modal が showModal() で開く
- [ ] DirectMessageGate のサインインボタンも同様に動作
- [ ] scoring-tool の DM一覧ページ計測が成功
- [ ] scoring-tool の DM詳細ページ計測が成功
- [ ] scoring-tool の全ユーザーフローテストが計測可能になる
- [ ] VRT が壊れないこと

## Work Log

### 2026-03-21 - 初回分析

**By:** Claude Code

**Actions:**
- scoring-tool のテストコード全件分析
- クライアント側の NavigationItem, Modal, AuthModalContainer を調査
- command/commandfor 属性の処理コードが存在しないことを確認

**Learnings:**
- Invoker Commands API はまだ全ブラウザ対応ではなく、自動テスト環境で動作保証なし
- 影響範囲は全認証フロー（~550点分のスコア）
