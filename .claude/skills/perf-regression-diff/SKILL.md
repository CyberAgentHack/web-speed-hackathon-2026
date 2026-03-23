---
name: perf-regression-diff
description: 2 回以上の Lighthouse 計測結果を比較し、改善・悪化・計測ノイズを判定する。「前回と比較して」「改善した？」「スコアの変化は誤差？」「施策の効果を見たい」といった場面で使う。計測がまだなら先に perf-measure を実行すること。
---

# パフォーマンス回帰・比較分析スキル

## 前提条件

- `perf-measurements/` に 2 つ以上のタイムスタンプディレクトリが存在すること
- 各ディレクトリに Lighthouse JSON または report.md が含まれていること
- 計測が 1 回分しかない場合は perf-measure で再計測するよう案内する

## ワークフロー

### Step 1: 比較対象の特定

```bash
ls -lt perf-measurements/ | head -20
```

比較したい 2 つ以上のタイムスタンプを決める。

### Step 2: Lighthouse JSON の読み込みと比較

各タイムスタンプの JSON から以下を抽出:

| 項目 | JSON パス |
|------|----------|
| Score | `categories.performance.score * 100` |
| FCP | `audits['first-contentful-paint'].numericValue` |
| SI | `audits['speed-index'].numericValue` |
| LCP | `audits['largest-contentful-paint'].numericValue` |
| TBT | `audits['total-blocking-time'].numericValue` |
| CLS | `audits['cumulative-layout-shift'].numericValue` |

### Step 3: 差分の判定

各メトリクスの差分を以下の基準で分類する:

| 判定 | 基準 |
|------|------|
| **改善（確信度 高）** | 全ページで同方向に改善 + 絶対値の変化が大きい |
| **改善（確信度 中）** | 大半のページで改善 + 1 ページだけ横ばいまたは微悪化 |
| **ノイズの可能性** | ページ間で方向がバラバラ、または差分が微小 |
| **悪化（要調査）** | 全ページで同方向に悪化 |

TBT の特別扱い: TBT は配点 30 で最大だが、計測ぶれも最大。TBT 単体の悪化でスコア全体が下がっている場合、他メトリクスの絶対値を併せて判断する。

### Step 4: レポート出力

`perf-measurements/latest/regression-diff.md` に出力:

```markdown
# 回帰分析レポート

**比較**: <TIMESTAMP_A> → <TIMESTAMP_B>
**判定日**: YYYY-MM-DD

## ページ表示スコア差分

| ページ | 前回 | 今回 | 差分 | 判定 |
|--------|------|------|------|------|

## フロースコア差分（あれば）

| フロー | 前回 | 今回 | 差分 | 判定 |
|--------|------|------|------|------|

## メトリクス別差分

| メトリクス | 配点 | ページ A | ページ B | ... | 判定 |
|-----------|------|---------|---------|-----|------|

## 総合判定

- 改善/悪化/横ばいの要約
- 再計測の推奨有無
- 支配要因の残存有無
```

## 判断ミスを防ぐ

| ミス | 対策 |
|------|------|
| 単発悪化で施策を否定 | 再計測 + 絶対値を見る |
| スコアは横ばいだが改善は正しい | 閾値帯手前の改善はスコアに出ない |
| ルート平均で局所改善を見逃す | ルート別に見る |
| TBT ぶれで全体が揺れる | TBT 以外のメトリクスも判断材料にする |

## Quick Reference

| 項目 | 値 |
|------|-----|
| 計測結果格納先 | `perf-measurements/<TIMESTAMP>/` (TIMESTAMP = `YYYY-MM-DD_HHmm` 形式) |
| 配点ウェイト | TBT:30, LCP:25, CLS:25, FCP:10, SI:10 |
| ノイズ閾値（目安） | Score ±5pt, TBT ±200ms, CLS ±0.05 |
