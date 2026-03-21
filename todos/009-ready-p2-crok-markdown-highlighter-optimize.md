---
status: in_progress
priority: p2
issue_id: "009"
tags: [perf, bundle, crok, lazy-load]
dependencies: []
---

# react-markdown + react-syntax-highlighter バンドル最適化

## Problem Statement

CrokContainer の SSR チャンクが 952KB。内訳は `react-markdown` + `react-syntax-highlighter`（highlight.js 全言語定義）。Crok チャット画面でのみ使用されるが、バンドルサイズが過大。

## Findings

- `dist-ssr/assets/CrokContainer-DfyW43In.js` = 952KB (gzip: 210KB)
- highlight.js の全言語定義がバンドルされている（数百ファイル分）
- サーバー初回 import に ~100ms かかる
- クライアント側でも同サイズのチャンクがダウンロードされる

## Optimization Candidates

- [ ] `react-syntax-highlighter` の `light` ビルドに切り替え、必要な言語のみ登録
- [ ] highlight.js → `shiki` 等の軽量代替を検討
- [ ] `react-markdown` の remark/rehype プラグインを最小限に絞る
- [ ] Crok 画面で実際に使われる言語を特定し、それ以外を除外

## Acceptance Criteria

- [ ] CrokContainer チャンクが 200KB 以下になること
- [ ] Crok チャット画面のマークダウン・コードハイライト表示が正常に動作すること
