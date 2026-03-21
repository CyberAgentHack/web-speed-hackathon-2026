---
status: ready
priority: p1
issue_id: "010"
tags: [perf, bundle, lazy, critical-path]
dependencies: []
---

# バンドル最適化 — 初期表示に必要なチャンクの最適化

## Problem Statement

lazy chunk のコールドスタートが E2E テストの flaky の原因。初回アクセス時に必要なコードが lazy chunk に分離されており、hydration → SWR 発火 → DOM 更新のパイプラインが遅い。

## Findings

- DM 詳細タイトルテストが初回失敗・retry 成功（flaky）
- `click` ステップに 845ms（DM リストデータ取得 + リンク出現待ち）
- `title` ステップに 372ms（lazy chunk 読込 + SWR fetch + useEffect 発火）
- CrokContainer の lazy chunk は 952KB（highlight.js 全言語定義、TODO 009 で追跡）

## Optimization Candidates

- [ ] 初期表示に必要なルートコンポーネントの `React.lazy()` 見直し（プリロード戦略）
- [ ] `<link rel="modulepreload">` でクリティカルチャンクを事前読み込み
- [ ] ルートごとのチャンク分割粒度の最適化（`manualChunks` 設定）

## Acceptance Criteria

- [ ] DM 詳細タイトルテストが初回から安定してパスする（flaky 解消）
- [ ] SPA ナビゲーション時の lazy chunk 読込がユーザー体感で遅延しない
