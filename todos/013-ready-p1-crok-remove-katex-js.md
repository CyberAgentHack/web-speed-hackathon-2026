---
status: complete
priority: p1
issue_id: "013"
tags: [perf, bundle, crok, katex, server-side]
dependencies: ["012"]
---

# Crok: KaTeX JS 除去 (-332 KB)

## Problem Statement

KaTeX JS (332 KB) がクライアントにバンドルされている。`crok-response.md` の数式 (inline `$...$` 約20箇所、display `$$...$$` 4箇所) をレンダリングするためだけに使用。

## Findings

- KaTeX は `katex.renderToString()` でサーバーサイドレンダリング可能 (Node.js/bun 対応)
- `rehype-katex` が内部で使うのと同じ関数
- 同一バージョン + 同一入力 → バイト単位で同一の HTML 出力
- E2E は `.katex` クラス要素の存在をチェック → `renderToString` の出力に含まれる
- `katex.min.css` (CSS) はクライアントに残す必要あり (JS ではないのでバンドルサイズ目標には影響しない)

## Approach: Post-Completion Replacement (012 の拡張)

012 で確立した「完了後差し替え」パターンを拡張。

### サーバー側 (`server/src/routes/api/crok.ts`)

1. 起動時に `crok-response.md` の数式を `katex.renderToString()` でプリレンダリング
2. 処理順序: コードブロック (012) → display math `$$...$$` → inline math `$...$`
3. コードブロック内の `$` は 012 で既に `<pre>` HTML に変換済みなのでマッチしない
4. プリレンダリング結果を `highlightedResponse` に含める

### クライアント側

1. `rehype-katex` と `remark-math` を `package.json` から削除
2. `katex` は CSS import 用に残す (`import "katex/dist/katex.min.css"`)
3. ストリーミング中: react-markdown (remarkMath/rehypeKatex なし) → 数式は `$...$` のまま表示
4. 完了後: プリレンダリング HTML で差し替え → 数式が `.katex` 付き HTML として描画

## Acceptance Criteria

- [ ] `rehype-katex` と `remark-math` が `package.json` から削除されている
- [ ] `katex` は CSS import 用に残っている
- [ ] `.katex` 要素が存在すること (E2E チェック通過)
- [ ] 数式が初期仕様と同じ見た目でレンダリングされること
- [ ] VRT `crok-AI応答完了後.png` がパスする
- [ ] クライアント JS が ~332 KB 追加削減されている
