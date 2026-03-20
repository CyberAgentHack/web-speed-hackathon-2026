---
status: ready
priority: p1
issue_id: "027"
tags: [server, performance, compression]
dependencies: []
---

# Brotli 圧縮の導入

## Problem Statement

Hono の `compress()` は gzip/deflate のみ対応。Brotli は gzip より 15-20% 高い圧縮率を持ち、モダンブラウザは全て対応済み。JS/CSS/HTML/WASM の転送量を削減できる。

## Findings

- `app.ts` で `compress()` 使用中（gzip/deflate のみ）
- Hono 4.12.8 の compress middleware は Brotli 未対応
- Node.js 24 の `zlib.createBrotliCompress()` が利用可能
- 現在の HTML 転送量: home=846B, post=8079B, terms=6889B

## Proposed Solutions

### A. カスタム Brotli ミドルウェア追加
- Node.js `zlib.createBrotliCompress()` を使用
- Accept-Encoding で brotli > gzip > deflate の優先順位
- Effort: 小 | Risk: 低

### B. Hono compress を置き換え
- compress() を削除し、全圧縮を自前実装
- Effort: 中 | Risk: 中

## Recommended Action

**A** を採用。既存の `compress()` を Brotli 対応のカスタムミドルウェアに置き換える。

## Acceptance Criteria

- [ ] WHEN `Accept-Encoding: br` ヘッダー送信 THEN `Content-Encoding: br` で応答
- [ ] WHEN Lighthouse 計測 THEN 転送サイズが gzip 比 15%+ 削減
- [ ] WHEN 全ページアクセス THEN 機能落ちなし

## Work Log
