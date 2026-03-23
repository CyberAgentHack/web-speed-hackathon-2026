---
name: perf-diagnose
description: スコアが低い原因を自動特定し、適切な調査スキルを組み合わせて根本原因まで掘り下げる。「なぜ遅い？」「原因を調べて」「ボトルネックは？」「どこが悪い？」といった場面で使う。計測だけなら perf-measure、改善提案なら perf-propose を使うこと。
---

# ボトルネック診断エージェント

## CRITICAL: 動作原則

- 計測結果がなければ perf-measure を先に実行する
- 調査スキルの選択は「配点ウェイト × 失点」に基づく（勘で選ばない）
- 調査結果を統合して 1 つの診断レポートにまとめる
- 施策提案はしない（それは perf-propose の役割）

## ワークフロー

### Phase 1: 計測結果の取得

1. `perf-measurements/latest/report.md` が存在するか確認
2. 存在しない場合 → perf-measure スキルを実行してベースラインを取得
3. 存在する場合 → report.md を読み込む

### Phase 2: 最大ボトルネックの特定

report.md の失点分析テーブルから:

1. 各メトリクスの失点を取得（失点 = 配点 × (1 - 平均スコア)）
2. 失点が最大のメトリクスを特定
3. 上位 2 つの失点差が 3 点以内なら両方を調査対象とする
4. ページ別スコアを確認し、特定ページだけ低い場合はそのページに絞る

ユーザーに最大ボトルネックを報告してから調査に進む。

### Phase 3: 調査スキルの自動実行

#### TBT（配点 30）が最大失点の場合

1. **bundle-analyze** を実行
   - Webpack 設定の最適化状態を確認
   - チャンクサイズと重い依存ライブラリの検出結果を記録
2. **dependency-prune** を実行
   - 未使用依存、不要 polyfill、遅延ロード候補を記録
3. 診断まとめ: 何が JS を膨張させているか

#### LCP（配点 25）が最大失点の場合

1. **cwv-trace-investigate** を実行（最もスコアが低いページ）
   - LCPBreakdown: TTFB / resource load / render delay の内訳を記録
   - LCPDiscovery: LCP 要素の発見タイミングを記録
2. **critical-path-audit** を実行
   - 圧縮の適用状態、render-blocking、Cache-Control を確認
3. 診断まとめ: LCP のボトルネック段階

#### CLS（配点 25）が最大失点の場合

1. **cwv-trace-investigate** を実行
   - CLSCulprits: シフトした要素を記録
2. 診断まとめ: CLS の原因要素と発生メカニズム

#### FCP（配点 10）が最大失点の場合

1. **critical-path-audit** を実行
   - 圧縮の適用状態、render-blocking リソース、HTML 転送サイズを確認
2. 診断まとめ: 初回描画を遅らせている原因

#### 特定ページだけ低い場合

1. **route-budget-check** を実行（該当ページ）
2. 上記のメトリクス別調査も該当ページに絞って実行
3. 診断まとめ: そのページ固有の問題

### Phase 4: 診断レポートの出力

`perf-measurements/latest/diagnosis.md` に出力:

```markdown
# ボトルネック診断レポート

**診断日**: YYYY-MM-DD
**計測日**: （report.md から転記）
**合計スコア**: XX / 1150

## 失点分析

| メトリクス | 配点 | 平均スコア | 失点 | 順位 |
|-----------|------|----------|------|------|

## 最大ボトルネック

**メトリクス**: [TBT / LCP / CLS / FCP]
**失点**: XX 点 / 配点 YY 点
**影響ページ**: 全ページ / 特定ページ名

## 調査結果

### [実行したスキル 1 の名前]
- 発見事項 1
- 発見事項 2

## 根本原因

1. **[原因 1]**: 具体的な説明
2. **[原因 2]**: 具体的な説明（あれば）

## 次のアクション

- 改善施策が必要なら → `perf-propose` を実行
- 最適化ループを回したいなら → `perf-optimize-loop` を実行
```

## Quick Reference

| 項目 | 値 |
|------|-----|
| 出力先 | `perf-measurements/latest/diagnosis.md` |
| 配点ウェイト | TBT:30, LCP:25, CLS:25, FCP:10, SI:10 |
| 使用スキル | perf-measure, bundle-analyze, dependency-prune, cwv-trace-investigate, critical-path-audit, route-budget-check |
