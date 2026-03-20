---
status: done
priority: p2
issue_id: "001"
tags: [server, performance, database, sequelize]
dependencies: []
---

# Sequelize クエリ最適化（ORM置き換えなし）

## Problem Statement

Sequelize の defaultScope による過剰な eager loading がサーバーレスポンス時間を悪化させている。ORM全体の置き換えはコスト対効果が低いため、現行 Sequelize のままクエリパターンを最適化する。

## Findings

- **DirectMessageConversation の defaultScope** が全メッセージ+sender+profileImage を3段ネストで常時ロード（最大のボトルネック）
- **DM afterSave hook** で毎回 unread count クエリ実行（`DirectMessage.count()` with complex include）
- **Search エンドポイント** で2クエリ実行後 JS 側で dedup/sort/slice
- **Auth signup** で `User.create()` 後に `User.findByPk()` で無駄な re-fetch
- Post の detail scope は commit 54b9373 で既に分離済み ✅
- **2026-03-20 コード確認:** Post model は defaultScope + detail/withUser/withMedia scope に分離済み。DM defaultScope は未修正のまま

## Proposed Solutions

### Option 1: defaultScope 分離 + クエリ最適化（推奨）

**Approach:** Post model で既にやった scope 分離パターンを DirectMessageConversation, Comment 等にも適用。

**Pros:**
- 実績あるパターンの横展開
- 変更ファイル 4-6 個で済む
- リグレッションリスク低

**Cons:**
- ルートハンドラ側で明示的に scope 指定が必要になる

**Effort:** 2-3 時間

**Risk:** Low

---

### Option 2: Drizzle ORM に置き換え

**Approach:** Sequelize を Drizzle ORM に全面移行。

**Pros:**
- 型安全、生成 SQL が予測可能
- バンドルサイズ削減（サーバー起動時間改善）

**Cons:**
- 19 ファイル全書き換え
- scopes, hooks, afterSave を自前再実装
- 14 アソシエーション再定義
- VRT + 手動テスト全パス必要

**Effort:** 1-2 日

**Risk:** High

---

### Option 3: better-sqlite3 直接利用

**Approach:** ORM 排除、生 SQL で全クエリ書き直し。

**Pros:**
- 同期 API で SQLite 最速
- ORM オーバーヘッド完全排除

**Cons:**
- 全クエリ手書き SQL 化
- bcrypt hook, eager loading 手動実装
- バグリスク最大

**Effort:** 1-2 日

**Risk:** High

## Recommended Action

**Option 1 を採用。** クライアント側のボトルネック（108MB main.js, WASM, CSR）がスコアに与える影響のほうが圧倒的に大きく、ORM 置き換えの ROI は低い。Sequelize 維持のまま以下を実施：

1. DirectMessageConversation の defaultScope から messages eager loading を分離
2. DM unread count のキャッシュまたはクエリ簡略化
3. Search の2クエリ統合
4. Auth signup の re-fetch 削除

## Technical Details

**Affected files:**
- `application/server/src/models/DirectMessageConversation.ts:48-61` - defaultScope 分離
- `application/server/src/models/DirectMessage.ts:75-107` - afterSave hook 最適化
- `application/server/src/routes/api/direct_message.ts` - scope 明示指定
- `application/server/src/routes/api/search.ts:41-91` - クエリ統合
- `application/server/src/routes/api/auth.ts:11-12` - re-fetch 削除

**Related components:**
- WebSocket unread count 通知（eventhub 経由）
- Post model の scope 分離パターン（commit 54b9373 参照）

## Acceptance Criteria

- [ ] DirectMessageConversation.findAll() がデフォルトで全メッセージをロードしない
- [ ] DM 作成時の unread count クエリが簡略化されている
- [ ] Search が単一クエリで結果を返す
- [ ] Auth signup が re-fetch しない
- [ ] VRT テスト全パス
- [ ] 手動テスト項目全パス
- [ ] Lighthouse スコアが悪化しない

## Work Log

### 2026-03-20 - 初期調査 & 方針決定

**By:** Claude Code

**Actions:**
- Sequelize 利用状況の全体調査（11モデル, 19ファイル, 14アソシエーション）
- ORM 置き換え3候補のコスト/インパクト比較
- サーバー側クエリパターンのボトルネック特定（DM defaultScope が最大）
- Option 1（クエリ最適化のみ）を推奨方針として決定

**Learnings:**
- このハッカソンのスコアはクライアント側（FCP/LCP/TBT）が支配的で、TTFB の改善はインパクト小
- Post model の scope 分離（commit 54b9373）が良いパターンとして横展開可能
- DirectMessageConversation の3段ネスト eager loading が最も重いクエリ

## Notes

- ORM 置き換え（Drizzle / better-sqlite3）はクライアント側最適化完了後に TTFB がボトルネック化した場合のみ再検討
- Lighthouse スコアへの直接インパクトは小さいが、初期化 API のレスポンス時間改善には寄与する
