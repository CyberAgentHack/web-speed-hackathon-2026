---
status: ready
priority: p2
issue_id: "017"
tags: [client, performance, lazy-load, markdown]
dependencies: []
---

# react-markdown の lazy load 化

## Problem Statement

ChatMessage.tsx で react-markdown が **静的 import** のまま残っている。react-syntax-highlighter は lazy 化済みだが、react-markdown 本体がバンドルの初期チャンクに含まれている。

## Findings

- `application/client/src/*/ChatMessage.tsx` line 2: `import Markdown from "react-markdown"`
- KaTeX CSS も直接 import（line 1）
- 003-complete で「lazy-load katex/markdown」とされているが react-markdown は漏れている

## Recommended Action

react-syntax-highlighter と同じパターンで `React.lazy()` + dynamic import に変更。

## Acceptance Criteria

- [ ] react-markdown が dynamic import で読み込まれている
- [ ] Crok チャットページが正常に動作する
- [ ] VRT テスト全パス
