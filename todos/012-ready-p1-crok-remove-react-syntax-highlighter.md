---
status: complete
priority: p1
issue_id: "012"
tags: [perf, bundle, crok, hljs, server-side]
dependencies: []
---

# Crok: react-syntax-highlighter 除去 (-793 KB)

## Problem Statement

`react-syntax-highlighter` が highlight.js の全190言語をバンドルし、クライアントJS 793 KB / 160チャンクを占める。Crok の crok-response.md で使う言語は 7 つだけ (json, bash, python, ts, rust, sql, text + mermaid)。

## Findings

- SSR チャンク `CrokContainer`: 952 KB (gzip 210 KB)
- hljs 関連: クライアント全体 2,558 KB のうち 793 KB (31%)
- `crok-response.md` は静的ファイル (`fs.readFileSync` で起動時に1回読み込み)
- サーバーは bun で動作
- 現行 `CodeBlock.tsx` は `React.lazy` + `Suspense` で react-syntax-highlighter を遅延ロード
- atomOneLight テーマの色値は CSS 版と JS 版で 100% 同一

## Approach: Post-Completion Replacement

**ストリーミング中の不完全HTML問題を回避するため、ストリーミング中は現行のまま、完了後にプリレンダリングHTMLに差し替える。**

### サーバー側 (`server/src/routes/api/crok.ts`)

1. 起動時に `crok-response.md` のコードブロックを highlight.js でプリハイライト
2. プリハイライト版を `highlightedResponse` として保持
3. SSE の `done: true` イベントで `highlightedResponse` を含めて送信:
   ```
   { text: "", done: true, highlighted: "<pre><code class='hljs'>...</code></pre>全文" }
   ```
   → SSE プロトコル (transport) は変更なし。データに項目追加は regulation で明確に許可されている

### クライアント側

1. `useSSE` の `onComplete` コールバックで `highlighted` フィールドを受け取る
2. ストリーミング中: 現行の react-markdown + CodeBlock (Suspense fallback の plain `<pre><code>`) で表示
3. 完了後: `highlighted` の内容で該当コードブロック部分を差し替え、または全文HTMLを `dangerouslySetInnerHTML` で描画
4. `react-syntax-highlighter` を `package.json` から削除
5. `CodeBlock.tsx` を削除

### CSS

- `highlight.js/styles/atom-one-light.css` をクライアントに追加 (~3KB)
- `<pre>` の customStyle (fontSize 14px, padding 24px 16px, borderRadius 8px, border) を CSS で再現

## Acceptance Criteria

- [ ] `react-syntax-highlighter` が `package.json` から削除されている
- [ ] `CodeBlock.tsx` が削除されている
- [ ] コードブロックがシンタックスハイライトされること (E2E `pre code` チェック通過)
- [ ] VRT `crok-AI応答完了後.png` がパスする
- [ ] ビルド後の hljs 関連チャンクが 0 になっている
- [ ] クライアント JS が ~793 KB 削減されている
