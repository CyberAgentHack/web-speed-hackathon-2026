---
status: ready
priority: p2
issue_id: "003"
tags: [webpack, performance, code-splitting, katex, react-markdown]
dependencies: ["001"]
---

# KaTeX / react-markdown を Crok ルート専用 lazy chunk に移動

## Problem Statement

KaTeX と react-markdown は `/crok` ページでのみ使用されるが、現在 initial vendors バンドルに含まれている可能性がある。全ページの初期ロードで不要なコードをダウンロードさせている。

## Findings

- KaTeX: 数式レンダリング用。Crok AI チャットの応答表示でのみ使用
- react-markdown: Markdown レンダリング用。同じく Crok ページ限定
- KaTeX fonts は `CopyWebpackPlugin` で `dist/styles/fonts/` にコピーされている (1.03MB)
- Issue 001 でルート分割すれば、CrokContainer 経由の import は自動的に lazy chunk になる

## Proposed Solutions

### Option A: Issue 001 の自然な結果として解決

CrokContainer を `React.lazy` にすれば、そこから import される KaTeX/react-markdown も自動的に Crok チャンクに移動する。

- **Pros:** 追加作業不要
- **Effort:** なし (Issue 001 に含まれる)
- **Risk:** なし

### Option B: コンポーネントレベルで明示的に lazy import

KaTeX/react-markdown を使うコンポーネント内で `React.lazy` + dynamic import を使い、確実に分離する。

- **Pros:** ルート分割に依存しない、粒度が細かい
- **Effort:** 小
- **Risk:** 低

## Recommended Action

Issue 001 を先に実施し、KaTeX/react-markdown が自動的に Crok チャンクに含まれるか確認。含まれなければ Option B を実施。

## Acceptance Criteria

- [ ] KaTeX が initial バンドル (vendors.js / main.js) に含まれていない
- [ ] react-markdown が initial バンドルに含まれていない
- [ ] `/crok` ページで KaTeX/react-markdown が正常に動作する
- [ ] VRT が通ること

## Work Log

### 2026-03-20 - Initial Analysis

**By:** Claude Code

**Actions:**
- KaTeX と react-markdown の使用箇所を特定 (Crok ページのみ)
- KaTeX fonts のコピー設定を確認

**Learnings:**
- Issue 001 のルート分割で自然に解決される可能性が高い
- KaTeX fonts (1.03MB) は別途最適化の余地あり (woff2 のみに絞る等)
