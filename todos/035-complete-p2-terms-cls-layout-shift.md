---
status: ready
priority: p2
issue_id: "035"
tags: [performance, lighthouse, cls, terms]
dependencies: []
---

# terms ページの CLS 0.06 を解消する

## Problem Statement

terms ページのみ CLS が 0.06 で、全ページ中唯一レイアウトシフトが発生している。他の全ページは CLS=0.00。

## Findings

- **Lighthouse (3 runs):** CLS mean=0.06, stddev=0.00, CV=0.0%（再現性 100%）
- 全ラウンドで同じ 0.06 — 偶発ではなく確定的なレイアウトシフト
- terms ページは利用規約テキスト表示ページ
- Score は 96 と高いが CLS が足を引っ張っている
- 原因候補: フォント読み込みによる FOUT、動的コンテンツ挿入、画像サイズ未指定

## Acceptance Criteria

- [ ] terms の CLS が 0.01 以下
- [ ] Lighthouse Score 96 以上を維持
- [ ] VRT が通ること

## Work Log

### 2026-03-20 - Bench 計測結果記録

**By:** Claude Code

**Actions:**
- Lighthouse 3回計測: CLS=0.06（全ラウンド一致）

**Learnings:**
- 再現性 100% なので特定しやすいはず
- terms ページのレンダリングフローを確認して CLS 原因要素を特定する必要あり
