---
name: perf-optimize-loop
description: 計測→診断→提案→実装→検証→再計測のループを自律的に回し、目標スコアまで最適化を繰り返す。「スコアを XX 点まで上げて」「最適化を回して」「イテレーション開始」といった場面で使う。個別の計測には perf-measure、個別の提案には perf-propose を使うこと。
---

# 最適化イテレーションエージェント

## CRITICAL: 動作原則

- 1 イテレーションで 1 施策のみ実装する（効果分離のため）
- 施策の承認は必ずユーザーに確認する（勝手に実装しない）
- レギュレーション違反がある場合はイテレーションを中断する
- 3 イテレーション連続でスコア横ばい（±3 点以内）なら停止してユーザーに相談

## 開始時の確認

1. **目標スコアの確認**: ユーザーが指定していなければ確認する
2. **現在のスコア**: perf-measurements/latest/report.md から取得。なければ perf-measure を実行
3. **目標との差分**: 現在スコアと目標の差を計算し、見通しを報告

注意: ページ表示300点未満ではフロー採点が行われないため、まずランディング改善を優先。

## イテレーションループ

### Step 1: 現状診断

- 初回 or 前回から大きく変わった場合 → perf-diagnose を実行
- 前回イテレーションの直後 → 前回の perf-regression-diff 結果を参照

### Step 2: 施策提案

perf-propose スキルを実行し、優先度付きの施策リストを取得。

### Step 3: ユーザー承認（必須停止ポイント）

以下を提示して承認を待つ:

```
=== イテレーション N ===
現在スコア: XX / 1150（目標: YY）

提案施策:
1. [施策名] — 期待改善: +X 点, 難易度: 低
2. [施策名] — 期待改善: +X 点, 難易度: 中

推奨: 施策 1 から着手

承認しますか？ (番号を指定 / 全てスキップ / ループ停止)
```

### Step 4: 実装

承認された施策を実装する。
実装前に perf-experiment-log の Baseline + Hypothesis を記録。

### Step 5: レギュレーション確認

regulation-guard の観点で変更内容をチェック:
- 変更ファイルがリスクマップの HIGH に該当する場合は慎重に確認
- 問題がある場合はこのステップで修正

### Step 6: ビルド・テスト検証

perf-validate スキルを実行:
- PASSED → Step 7 へ
- FAILED → 原因を修正して再検証。3 回失敗したら施策を revert してユーザーに報告

### Step 7: 再計測

perf-measure スキルを実行し、新しい計測結果を取得。

### Step 8: 効果判定

perf-regression-diff スキルを実行:
- 改善（確信度 高/中）→ 施策を維持
- ノイズの可能性 → 再計測を 1 回追加
- 悪化 → 施策を revert するか、ユーザーに判断を委ねる

### Step 9: 記録

perf-experiment-log の Validation + Risk + Next Action を記録。

### Step 10: 結果報告と継続判定

**停止条件**:
- 目標スコア達成 → 「目標達成しました！」と報告して終了
- ユーザーが停止指示 → 現時点のサマリーを報告して終了
- 3 イテレーション連続でスコア横ばい（±3 点以内）→ ユーザーに相談

## イテレーション管理

各イテレーションの状態を `perf-measurements/latest/iterations.md` に追記。

## Quick Reference

| 項目 | 値 |
|------|-----|
| イテレーション記録 | `perf-measurements/latest/iterations.md` |
| 停止条件 | 目標達成 / ユーザー停止 / 3 回連続横ばい |
| 1 イテレーションの流れ | 診断 → 提案 → 承認 → 実装 → 検証 → 計測 → 判定 → 記録 |
| 使用スキル | perf-diagnose, perf-propose, perf-experiment-log, regulation-guard, perf-validate, perf-measure, perf-regression-diff |
| 満点 | 1150 (表示 900 + 操作 250) |
