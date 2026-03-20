---
status: complete
priority: p3
issue_id: "026"
tags: [react, code-quality, accessibility]
dependencies: []
---

# React Doctor 指摘事項の修正 (Score: 93/100)

## Problem Statement

react-doctor v0.0.30 の解析で 1 error / 26 warnings が検出された。スコアは 93/100 で高いが、missing key エラーやアクセシビリティ問題が含まれる。

## Findings

### Error (1件)
- `src/components/direct_message/DirectMessagePage.tsx:126` — iterator 内の要素に `key` prop が欠落

### Warnings (26件)

**React パターン:**
- 配列 index を key に使用 (4箇所): `SoundPlayer.tsx:33`, `CrokPage.tsx:31`, `ChatInput.tsx:65,211`
- `ChatInput` に useState 5個 → useReducer 推奨: `ChatInput.tsx:78`
- 1つの useEffect 内に setState 6回 (2箇所): `ChatInput.tsx:117`, `SearchPage.tsx:49`

**アクセシビリティ:**
- クリッカブル要素にキーボードイベントなし: `TimelineItem.tsx:50`

**不明プロパティ:**
- 6箇所: `DirectMessageGate.tsx:27,28`, `CrokGate.tsx:27,28`, `CoveredImage.tsx:35,36`

**デッドコード:**
- 未使用ファイル: `entry-server.tsx`, `format_date.test.ts`, `get_path.test.ts`
- 未使用 export `unwrap`: `client.ts`, `fetchers.ts`, `convert_image.ts` (各2箇所)
- 未使用型 `SSRData`: `AppContainer.tsx`, `store/index.ts` (各1.5箇所)

## Proposed Solutions

### Option 1: Error のみ修正

**Approach:** missing key エラー 1件だけ修正。最小限の変更。

**Pros:**
- VRT 破壊リスクゼロ
- 即座に完了

**Cons:**
- warnings は放置

**Effort:** 5分
**Risk:** Low

---

### Option 2: Error + React パターン warnings 修正

**Approach:** key エラー + index-as-key + アクセシビリティを修正。

**Pros:**
- リスト再レンダリングのバグ予防
- a11y 改善

**Cons:**
- ChatInput の useReducer 化はスコープが大きい

**Effort:** 30分-1時間
**Risk:** Low

---

### Option 3: 全件修正

**Approach:** デッドコード削除含めすべて対応。

**Pros:**
- スコア 100 を目指せる
- コードベースがクリーンに

**Cons:**
- entry-server.tsx は SSR で使用されており react-doctor が検知できていない可能性
- 未使用 export 削除で他ファイルへの影響確認が必要

**Effort:** 1-2時間
**Risk:** Medium (SSR 関連の誤検知リスク)

## Recommended Action

*To be filled during triage.*

## Technical Details

**Affected files:**
- `src/components/direct_message/DirectMessagePage.tsx:126`
- `src/components/foundation/SoundPlayer.tsx:33`
- `src/components/crok/CrokPage.tsx:31`
- `src/components/crok/ChatInput.tsx:65,78,117,211`
- `src/components/application/SearchPage.tsx:49`
- `src/components/timeline/TimelineItem.tsx:50`
- `src/components/direct_message/DirectMessageGate.tsx:27,28`
- `src/components/crok/CrokGate.tsx:27,28`
- `src/components/foundation/CoveredImage.tsx:35,36`
- `src/api/client.ts`
- `src/utils/fetchers.ts`
- `src/utils/convert_image.ts`
- `src/containers/AppContainer.tsx`
- `src/store/index.ts`

## Resources

- **Tool:** [react-doctor](https://github.com/millionco/react-doctor) v0.0.30
- **Full diagnostics:** `/tmp/react-doctor-e9f635f5-a828-4fb6-bc5d-7f8c7c2e9231`

## Acceptance Criteria

- [ ] react-doctor error が 0 件
- [ ] VRT が通る
- [ ] 手動テストに影響なし

## Work Log

### 2026-03-20 - Initial Scan

**By:** Claude Code

**Actions:**
- `npx react-doctor@latest ./application/client --verbose` を実行
- Score: 93/100, 1 error, 26 warnings across 17/104 files
- 結果を todo に記録

**Learnings:**
- entry-server.tsx は SSR エントリポイントなので react-doctor の「未使用」検知は誤検知
- テストファイル (*.test.ts) も「未使用」として検知されるが正常

## Notes

- パフォーマンス改善（Web Speed Hackathon のスコア向上）には直接寄与しない項目が多い
- missing key は React の再レンダリング効率に影響するため、パフォーマンス面でも有用
