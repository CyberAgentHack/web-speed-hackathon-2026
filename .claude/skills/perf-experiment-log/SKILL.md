---
name: perf-experiment-log
description: 最適化施策の仮説・変更・結果・次アクションを構造化した実験ログとして記録する。「実験ログを残して」「この施策の記録を書いて」「効かなかった理由を残しておいて」「before-after を記録して」といった場面で使う。
---

# パフォーマンス実験ログスキル

## CRITICAL: 効かなかった施策こそ記録する

効かなかった施策の記録が不足すると、同じ失敗を繰り返す。以下を必ず残す:
- なぜ効かなかったか（支配要因に埋もれた？閾値帯手前？順番が悪い？）
- 再評価すべき条件（支配要因が解消されたら効くか？）
- 同種の施策を今後避けるべきか、条件付きで再試行すべきか

## テンプレート

```markdown
# 実験ログ: [施策タイトル]

**実験 ID**: EXP-YYYY-MM-DD-NN
**対象メトリクス**: TBT / LCP / CLS / FCP / SI / INP
**ステータス**: 計画中 / 実施中 / 完了（効果あり） / 完了（効果なし） / 中止

## 1. Baseline
- **対象ルート**: 全ページ / 特定ページ名
- **計測日時**: YYYY-MM-DD HH:MM
- **現在のスコア**:

| ページ | Score | FCP | LCP | TBT | CLS |
|--------|-------|-----|-----|-----|-----|

## 2. Hypothesis
- **何が支配要因か**: [例: Webpack 最適化が全無効でバンドルが巨大]
- **なぜそう考えたか**: [例: bundle-analyze で minimize: false, splitChunks: false を確認]
- **期待する改善**: [例: TBT が 3000ms → 500ms 以下に]
- **改善しない場合に考えられる理由**: [例: バンドルサイズが TBT の主因でない場合]

## 3. Change
- **変更ファイル**:
  - `application/client/xxx.ts` — [変更内容]
- **コミット**: [ハッシュ] or PR #N
- **レギュレーションリスク**: あり / なし

## 4. Validation
- **計測日時**: YYYY-MM-DD HH:MM
- **結果**:

| ページ | Score | FCP | LCP | TBT | CLS | 前回比 |
|--------|-------|-----|-----|-----|-----|--------|

- **判定**: 改善（確信度 高/中） / ノイズの可能性 / 効果なし / 悪化
- **perf-validate**: PASSED / FAILED

## 5. Risk
- **デザイン差分**: あり / なし（VRT 結果）
- **機能差分**: あり / なし
- **ロールバックの影響**: [例: revert するだけで OK]

## 6. Next Action
- **仮説が正しかった場合**: [次の施策]
- **仮説が間違っていた場合**: [別のアプローチ]
- **追加調査が必要な場合**: [何を調べるか]
```

## ワークフロー

### 施策開始前

1. テンプレートの Section 1（Baseline）と Section 2（Hypothesis）を記入
2. `perf-measurements/latest/experiments/EXP-YYYY-MM-DD-NN.md` に保存
3. perf-measure で直前のベースラインを取っておく

### 施策実装後

1. Section 3（Change）を記入
2. perf-validate でビルド+レギュレーション確認
3. perf-measure で計測
4. Section 4（Validation）を記入
5. perf-regression-diff で前回との差分を評価
6. Section 5（Risk）と Section 6（Next Action）を記入

## よくあるミス

| ミス | 対策 |
|------|------|
| 仮説を書かずに実装する | 仮説がないと因果が追えない |
| 効かなかった施策を記録しない | 効かなかった理由は次の施策選定に直結する |
| ベースラインを取らない | 実装前のスコアがないと比較できない |
| 複数施策を同時に入れる | 何が効いたか分離できない。1 施策ずつ変更する |

## Quick Reference

| 項目 | 値 |
|------|-----|
| 実験ログ格納先 | `perf-measurements/latest/experiments/` |
| 関連スキル | perf-measure（計測）, perf-regression-diff（差分評価）, perf-validate（検証） |
