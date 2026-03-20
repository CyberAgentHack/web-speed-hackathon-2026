---
status: ready
priority: p1
issue_id: "004"
tags: [server, performance, compression, transfer-size]
dependencies: []
---

# gzip/Brotli 圧縮配信

## Problem Statement

サーバーがレスポンスを無圧縮で配信している。vendors.js (322KB) は gzip で ~80KB、Brotli で ~65KB まで圧縮可能。転送量の削減は LCP/FCP に直結する。

## Findings

- Express サーバー (`src/app.ts`) に compression ミドルウェアが設定されていない
- 静的ファイル (JS/CSS/HTML) はすべて無圧縮で配信
- contenthash 付きファイル名なのに圧縮されていないのは非効率

## Proposed Solutions

### Option A: Express compression ミドルウェア

`compression` パッケージで動的圧縮。

- **Pros:** 導入が簡単 (1行追加)、全レスポンスに適用
- **Cons:** CPU コスト (リクエスト毎に圧縮)。Brotli はデフォルトで遅い
- **Effort:** 極小
- **Risk:** 低

### Option B: ビルド時に事前圧縮 (.gz / .br ファイル生成)

webpack plugin (`compression-webpack-plugin`) でビルド時に圧縮ファイルを生成し、Express で事前圧縮ファイルを返す。

- **Pros:** CPU コスト不要、最大圧縮率
- **Cons:** ビルドが遅くなる、Express 側で事前圧縮ファイルを返すロジックが必要
- **Effort:** 中
- **Risk:** 低

### Option C: A + B の併用

静的アセットは事前圧縮、API レスポンスは動的圧縮。

- **Pros:** 最適解
- **Effort:** 中
- **Risk:** 低

## Recommended Action

まず Option A で即効性を得る。効果計測後、必要なら Option B を追加。

## Acceptance Criteria

- [ ] JS/CSS/HTML レスポンスが gzip または Brotli で圧縮されている
- [ ] `curl -H "Accept-Encoding: gzip" -sI` でレスポンスヘッダに `Content-Encoding: gzip` が含まれる
- [ ] Lighthouse のスコアが改善されている
- [ ] VRT が通ること

## Work Log

### 2026-03-20 - Initial Analysis

**By:** Claude Code

**Actions:**
- サーバーコードに compression 設定がないことを確認

**Learnings:**
- 圧縮なしの場合、バンドル分割の効果が転送量に反映されにくい
