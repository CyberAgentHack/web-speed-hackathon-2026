---
status: done
priority: p1
issue_id: "002"
tags: [webpack, performance, code-splitting, vendors]
dependencies: []
---

# Vendors チャンクの細分化

## Problem Statement

`splitChunks.cacheGroups` で `node_modules` 全体が1つの `vendors` チャンク (1.1MB) にまとめられている。React 等のコアライブラリと、KaTeX・react-markdown 等の特定ページでしか使わないライブラリが混在し、初期ロードで全て読み込まれる。

## Findings

- 現在の `splitChunks` 設定:
  ```js
  vendors: {
    test: /[\\/]node_modules[\\/]/,
    name: "vendors",
    chunks: "initial",
    priority: -10,
  }
  ```
- `vendors.js` = 1.1MB (initial load)
- KaTeX は `/crok` ページでのみ使用
- react-markdown も `/crok` ページでのみ使用
- standardized-audio-context はオーディオ再生時のみ必要

## Proposed Solutions

### Option A: cacheGroups の細分化

react/react-dom を `react-vendor` として分離し、残りの initial vendors を小さくする。

- **Pros:** キャッシュ効率向上、React は変更頻度が低いので長期キャッシュ可能
- **Effort:** 小
- **Risk:** 低

### Option B: Issue 001 (ルート分割) と組み合わせ

ルート分割が入れば、KaTeX/react-markdown は Crok ルートの lazy チャンクに自動的に含まれる。vendors には React 等のコアのみ残る。

- **Pros:** 自然に解決、追加設定不要
- **Effort:** Issue 001 に依存
- **Risk:** 低

## Recommended Action

Issue 001 (ルート分割) を先に実施し、その結果を見て vendors チャンクの残りサイズを確認。まだ大きければ Option A で react/react-dom を分離する。

## Acceptance Criteria

- [ ] `vendors.js` の初期ロードサイズが 500KB 以下
- [ ] react/react-dom が独立チャンクとして分離されている (optional)
- [ ] KaTeX, react-markdown が初期ロードに含まれていない
- [ ] ビルドが正常に完了する

## Work Log

### 2026-03-20 - Initial Analysis

**By:** Claude Code

**Actions:**
- webpack.config.js の splitChunks 設定を確認
- vendors.js が 1.1MB であることを確認
- KaTeX fonts が CopyWebpackPlugin で dist に配置されていることを確認

**Learnings:**
- `chunks: "initial"` のため、dynamic import 経由のモジュールは含まれない
- 重量級ライブラリ (ffmpeg, imagemagick, web-llm) は既に lazy chunk に分離済み
- vendors の主な内容は React エコシステム + KaTeX + react-markdown 等の UI ライブラリ
