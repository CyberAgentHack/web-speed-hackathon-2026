---
name: cwv-trace-investigate
description: chrome-devtools MCP のパフォーマンストレースで LCP/CLS/TBT の根本原因を分解する。「Lighthouse スコアが低いが原因が分からない」「LCP が遅い理由を調べて」「CLS の原因要素は？」「トレースして」といった場面で使う。スコア計測には perf-measure を使うこと。
---

# Core Web Vitals トレース調査スキル

## 前提条件

- サーバーが起動していること（`http://localhost:3000` に接続可能）
- Chrome ブラウザが起動していること（chrome-devtools MCP 用）

## ワークフロー

### Step 1: 対象ページの選定

perf-measure の `report.md` から、最もスコアが低い 1-2 ページを選ぶ。
症状が違うページを優先（例: ホームは TBT 寄り、利用規約は FCP 寄り）。

### Step 2: トレースの取得

```
chrome-devtools MCP:
1. navigate_page → 対象 URL
2. performance_start_trace (reload: true, autoStop: true)
3. 返ってきた insights をすべて記録
```

### Step 3: インサイトの分類

#### LCP が悪い場合に見るインサイト

| インサイト | 見るべきこと |
|-----------|------------|
| **LCPDiscovery** | LCP 要素がいつ発見されたか。HTML parse 中か、JS 実行後か |
| **LCPBreakdown** | TTFB / resource load / render delay の内訳 |
| **DocumentLatency** | HTML の取得にかかった時間 |
| **RenderBlocking** | LCP を遅らせている render-blocking リソース |

LCP の典型パターン（このプロジェクトで予想されるもの）:
- Tailwind CSS CDN が render-blocking → ビルド時コンパイルで解決
- JS バンドルが巨大で React の初回レンダーが遅い → Webpack 最適化 + コード分割
- 画像の発見が JS 実行後 → SSR or preload で早期発見

#### CLS が悪い場合に見るインサイト

| インサイト | 見るべきこと |
|-----------|------------|
| **CLSCulprits** | どの要素がシフトしたか |

CLS の典型パターン:
- 画像の width/height 未指定 → 属性追加
- フォント読み込みによるレイアウトシフト → font-display: swap + サイズ調整
- 動的コンテンツ挿入 → プレースホルダーや min-height

#### TBT が悪い場合に見るもの

- long task の数と内容
- main thread のビジーな時間帯
- bundle-analyze の結果と突き合わせる

### Step 4: 深掘り

```
chrome-devtools MCP:
performance_analyze_insight → insight 名を指定して詳細取得
```

### Step 5: 結果の記録

`perf-measurements/latest/trace-analysis.md` に記録:

```markdown
# トレース分析結果

**対象ページ**: [URL]
**分析日**: YYYY-MM-DD

## LCP 分析
- LCP 要素: [要素の説明]
- 発見経路: HTML parse 中 / JS 実行後
- TTFB: Xms, Resource Load: Xms, Render Delay: Xms
- ボトルネック: [最も遅い段階]

## CLS 分析
- シフト要素: [要素一覧]
- 原因: [画像サイズ / フォント / 動的挿入]

## その他のインサイト
- [RenderBlocking, DocumentLatency 等]

## 推奨アクション
1. ...
```

## Quick Reference

| 項目 | 値 |
|------|-----|
| MCP ツール | `navigate_page`, `performance_start_trace`, `performance_analyze_insight` |
| 重要インサイト | LCPBreakdown, LCPDiscovery, CLSCulprits, RenderBlocking, DocumentLatency |
| 出力先 | `perf-measurements/latest/trace-analysis.md` |
| 配点ウェイト | TBT:30, LCP:25, CLS:25, FCP:10, SI:10 |
