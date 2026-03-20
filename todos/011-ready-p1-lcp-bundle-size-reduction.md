---
status: ready
priority: p1
issue_id: "011"
tags: [client, performance, webpack, bundle, lcp]
dependencies: []
---

# LCP 改善: バンドルサイズ 73MB → 目標 5MB 以下

## Problem Statement

Lighthouse ベンチマーク（2026-03-20）で全ページの LCP が **43,000〜45,000ms（約44秒）** を記録。スコア合計 **419/900**。最大のボトルネック。

## Findings

**既に適用済みの最適化（コード確認済み 2026-03-20）:**
- ✅ `mode: 'production'`, `minimize: true`, `splitChunks: all`
- ✅ TerserPlugin (ecma: 2020)
- ✅ `concatenateModules`, `usedExports`, `sideEffects` 有効
- ✅ ルート全体が `React.lazy()` + dynamic import
- ✅ FFmpeg, ImageMagick, WebLLM, kuromoji → 全て dynamic import 済み
- ✅ react-syntax-highlighter → lazy 済み
- ✅ jQuery, moment, lodash, bluebird → ソースから import 削除済み
- ✅ compression ミドルウェア有効
- ✅ 静的ファイルに Cache-Control 設定済み

**にもかかわらずバンドルが 73MB の原因候補:**
- ❌ react-markdown: **静的 import のまま**（ChatMessage.tsx）
- ❌ core-js / regenerator-runtime: package.json に残存（Babel 経由でバンドル？）
- ❌ jQuery, moment, lodash, bluebird: package.json に残存（tree shaking で消えてる？要確認）
- ❌ redux-form: 10 ファイルで使用中（重量ライブラリ）
- ❓ WASM バイナリが `?binary` query で静的バンドルされている可能性
- ❓ 73MB のうち実際にブラウザがダウンロードする量（gzip 後）が不明

**バンドルサイズ内訳（bench/frontend.sh 計測、ディスク上）:**
- chunk-f56cc1e7: 4.21 MB
- chunk-b4864f95: 2.14 MB
- 他22チャンク: ~67 MB
- **合計: 73.57 MB（ディスク上、圧縮前）**

## Proposed Solutions

### Option A: 残存問題の個別修正（推奨）

1. **react-markdown を lazy 化**（ChatMessage.tsx の静的 import を dynamic に）
2. **core-js / regenerator-runtime を package.json から削除**（Babel target が ecma:2020 なら不要）
3. **jQuery, moment, lodash, bluebird を package.json から削除**（import がないなら不要）
4. **redux-form → 軽量代替 or native form に置き換え**
5. **WASM バイナリの `?binary` ローダーを確認** — バンドルに含まれていればチャンクが巨大化
6. **webpack-bundle-analyzer で実際の内訳を確認**（最重要、何が 73MB を占めるか特定）

### Option B: SSR 導入

FCP=LCP にしてバンドルサイズの影響を緩和。

## Recommended Action

**まず webpack-bundle-analyzer で 73MB の内訳を可視化し、上位チャンクの中身を特定。** dynamic import 済みなのに巨大なのは WASM バイナリか tree shaking 漏れの可能性が高い。

## Acceptance Criteria

- [ ] webpack-bundle-analyzer で上位チャンクの内訳を特定
- [ ] 初期ロードの JS が 5MB 以下（gzip 前）
- [ ] LCP が全ページで 10 秒以下
- [ ] Lighthouse 合計スコアが 600/900 以上
- [ ] VRT テスト全パス

## Work Log

### 2026-03-20 - ベンチマーク計測 & 問題特定

**By:** Claude Code

**Actions:**
- bench/run-all.sh で全レイヤー計測（合計 419/900）
- LCP 44秒 = バンドルサイズが原因と特定

### 2026-03-20 - コード状態クロスチェック

**By:** Claude Code

**Actions:**
- webpack.config.js: production mode, minimize, splitChunks 全て適用済みを確認
- 全 WASM/重量ライブラリが dynamic import 済みを確認
- にもかかわらず 73MB → WASM バイナリの静的バンドルか tree shaking 漏れが原因と推定
- react-markdown の静的 import、core-js/redux-form の残存を発見

**Learnings:**
- 「最適化を設定した」と「実際にバンドルが縮小した」は別問題
- dynamic import してても `?binary` ローダーで WASM が初期チャンクに入る可能性
- webpack-bundle-analyzer で実態確認が最優先
