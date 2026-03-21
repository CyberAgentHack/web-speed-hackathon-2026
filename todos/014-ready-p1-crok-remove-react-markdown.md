---
status: complete
priority: p1
issue_id: "014"
tags: [perf, bundle, crok, react-markdown, server-side]
dependencies: ["012", "013"]
---

# Crok: react-markdown 除去 (-91 KB)

## Problem Statement

`react-markdown` (91 KB) + `remark-gfm` がクライアントにバンドルされている。012/013 で hljs と KaTeX をサーバーサイド化した後、react-markdown の役割は GFM markdown → HTML 変換のみ。これもサーバーで処理可能。

## Findings

- `react-markdown` は毎回フルパース (インクリメンタルパースなし)
- `key={content}` により毎文字でアンマウント/リマウント → 壊滅的パフォーマンス
- `index.css` の `@utility markdown` は `:where()` セレクタで素の HTML 要素をスタイリング → `dangerouslySetInnerHTML` でも適用される
- unified + remark-parse + remark-gfm + remark-rehype + rehype-raw + rehype-stringify でサーバーサイド変換可能
- crok-response.md の GFM 機能: テーブル、取り消し線、脚注

## Approach: 完全サーバーサイド変換 + ストリーミング簡素化

### サーバー側 (`server/src/routes/api/crok.ts`)

1. 起動時に unified パイプラインで markdown 全体を HTML に変換:
   - remark-parse → remark-gfm → remark-rehype (allowDangerousHtml) → rehype-raw → rehype-stringify
2. 処理順序: コードブロック (012) → 数式 (013) → markdown→HTML (014)
3. `highlightedResponse` は完成 HTML

### クライアント側

1. `react-markdown`, `remark-gfm` を `package.json` から削除
2. `ChatMessage.tsx` を簡素化:
   - ストリーミング中: `<div style="white-space: pre-wrap">{content}</div>` (プレーンテキスト表示)
   - 完了後: `<div dangerouslySetInnerHTML={{ __html: finalHtml }} />` (サーバーレンダリング HTML)
3. `React.lazy`, `Suspense` 不要に
4. `key={content}` 削除 → パフォーマンス大幅改善

### ストリーミング UX

- ストリーミング中はプレーンテキスト (マークダウン記法がそのまま見える)
- 完了時に一瞬でフルレンダリングに切り替わる
- ChatGPT 等も同様のパターン (コードブロック完成後にハイライト適用)

## Acceptance Criteria

- [ ] `react-markdown` と `remark-gfm` が `package.json` から削除されている
- [ ] Crok 固有のクライアント JS が ~0 KB (CSS のみ残存)
- [ ] `pre code` 要素が存在すること (E2E チェック通過)
- [ ] `.katex` 要素が存在すること (E2E チェック通過)
- [ ] Markdown が正しくレンダリングされること (テーブル、脚注、取り消し線)
- [ ] VRT `crok-AI応答完了後.png` がパスする
- [ ] `key={content}` が削除されストリーミング中の再マウントが解消されている
