---
name: perf-propose
description: perf-measure の計測結果をもとに、配点ウェイトと実現可能性を考慮した改善施策を提案する。「次は何を直す？」「改善案を考えて」「TBT を下げたい」「スコアが伸びない」といった場面で使う。計測がまだなら先に perf-measure を実行すること。
---

# パフォーマンス改善施策提案スキル

## CRITICAL: 前提条件

- `perf-measurements/latest/report.md` が存在すること
- 存在しない場合は perf-measure で計測するよう案内して終了する
- 机上の仮説ではなく、コードベースを実際に調査して具体的な変更内容まで落とし込む

## レギュレーション（施策提案時に必ず確認）

以下に違反する施策は絶対に提案しない:

1. VRT が通ること
2. 手動テスト項目が通ること（`docs/test_cases.md`）
3. `POST /api/v1/initialize` で DB リセット可能
4. Crok の SSE プロトコルを変更しない
5. シード ID を変更しない

## ワークフロー

### Step 1: 計測結果の読み込み

1. `perf-measurements/latest/report.md` で現状スコアを把握
2. Lighthouse JSON から詳細取得
3. 失点分析テーブルからインパクトの大きいメトリクスを特定

### Step 2: 優先度判定

配点ウェイト x 失点で優先度をつける:

| メトリクス | 配点 | 主な改善手段 |
|-----------|------|------------|
| TBT | 30 | Webpack 最適化有効化, コード分割, 重い依存除去, polyfill 除去, IE11 Babel 除去 |
| LCP | 25 | Tailwind CDN 除去, 画像最適化, preload, fetchpriority, SSR 導入検討 |
| CLS | 25 | 画像サイズ明示, フォントの FOUT 対策, レイアウトシフト要素の固定 |
| FCP | 10 | 圧縮 (gzip/brotli), render-blocking 除去, HTML サイズ削減, ソースマップ除去 |
| SI | 10 | 上記改善で連動 |

判断軸: 「失点 x 実現可能性」。失点が大きくても実装困難なものより、中程度でも即効性の高いものを先に出す。

### Step 3: コードベース調査

症状ごとに重点的に調査する:

**TBT が高い場合**
- `application/client/webpack.config.js` の最適化設定 (minimize, splitChunks, tree-shaking)
- `application/client/babel.config.js` の IE 11 ターゲット
- エントリポイントの import チェーン (core-js, regenerator-runtime, jquery-binarytransport)
- 重いライブラリ (FFmpeg WASM, ImageMagick WASM, Web-LLM, kuromoji, lodash, moment)
- `mode: "none"` → `mode: "production"` 変更

**LCP が高い場合**
- Tailwind CSS が CDN で実行時コンパイルされている (`index.html`)
- LCP 要素の特定と発見経路
- 画像の最適化状態 (フォーマット、サイズ)
- `fetchpriority="high"` の有無

**CLS が高い場合**
- 画像の width/height 未指定
- フォント読み込みによるレイアウトシフト (font-display)
- 動的コンテンツ挿入パターン

**FCP が高い場合**
- 圧縮の適用状態 (Cache-Control: max-age=0, etag: false)
- `devtool: "inline-source-map"` によるバンドル肥大
- render-blocking リソース

### Step 4: proposals.md 出力

`perf-measurements/latest/proposals.md` に以下の形式で出力:

```markdown
# 改善施策提案

**計測日時**: （report.md から転記）
**現在の推定スコア**: XX / 1150
**提案日時**: YYYY-MM-DD HH:MM

## 現状の課題サマリー
（失点分析から最も影響が大きい問題を 2-3 行で要約）

## 施策一覧

### 施策 1: [タイトル]
- **対象メトリクス**: TBT, LCP など
- **期待される改善**: 定性的説明
- **優先度**: 高 / 中 / 低
- **実装難易度**: 低 / 中 / 高
- **具体的な作業内容**: ファイルパスと変更内容
- **レギュレーション注意点**: あれば

## 優先順位テーブル
| 順位 | 施策 | 対象メトリクス | 期待改善 | 難易度 |
```

### Step 5: ユーザー報告

- 最優先の 2-3 施策をピックアップして報告
- 実装着手の確認を取る

## 提案時の注意: 効かないパターン

| パターン | なぜ効かないか |
|---------|--------------|
| 支配要因が残っている状態での局所修正 | スコアに反映されない |
| 閾値帯手前の改善 | 秒数は改善してもスコアは変わらない |
| 正しい改善だが順番が悪い | 先に潰すべきボトルネックがある |

## このプロジェクトで真っ先にやるべき施策（初期状態向け）

| 施策 | 対象 | 理由 |
|------|------|------|
| Webpack mode: production + minimize + splitChunks | TBT, FCP | 最適化が全無効。有効化だけで大幅改善が見込める |
| inline-source-map 除去 | FCP, TBT | バンドルサイズが倍増している |
| core-js + regenerator-runtime 除去 | TBT | 不要な polyfill が丸ごとバンドルされている |
| Babel ターゲットを Chrome latest に変更 | TBT | IE 11 向けトランスパイルが不要 |
| Tailwind CSS をビルド時に処理 | LCP, FCP | CDN からの実行時コンパイルが描画を遅延させている |
| jQuery → fetch API 置換 | TBT | jQuery 全体がバンドルに含まれている |
| gzip/brotli 圧縮の有効化 | FCP, 全体 | 現在 Cache-Control: max-age=0, etag: false |
| 重量級 WASM の遅延ロード | TBT | FFmpeg, ImageMagick, Web-LLM が初期バンドルに混入 |

## Quick Reference

| 項目 | 値 |
|------|-----|
| 計測結果 | `perf-measurements/latest/report.md` |
| 出力先 | `perf-measurements/latest/proposals.md` |
| 配点ウェイト | TBT:30, LCP:25, CLS:25, FCP:10, SI:10 |
| Webpack 設定 | `application/client/webpack.config.js` |
| Babel 設定 | `application/client/babel.config.js` |
| HTML テンプレート | `application/client/src/index.html` |
