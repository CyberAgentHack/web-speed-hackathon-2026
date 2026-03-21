---
status: ready
priority: p2
issue_id: "018"
tags: [perf, home, fcp, modulepreload, bundle]
dependencies: []
---

# 不要 modulepreload をホームから除外

## Problem Statement

ホームの `<head>` に7つの modulepreload がある。合計 93KB compressed がペイント前にDL開始され、LCP画像やCSSとネットワーク帯域を争う。ホームで不要な Redux chunk（18KB br）等を除外すべき。

## Findings

- modulepreload 一覧（compressed サイズ）:
  - `chunk-GofyGxxM.js`: 51KB — React DOM（必須）
  - `chunk-L6GGNK-z.js`: 23KB — Router/SWR（必須）
  - `chunk-CYwCVBXL.js`: 18KB — Redux（ホームで不要、redux-form のみ使用）
  - `chunk-D--xHZs5.js`: 0.6KB — React core（必須）
  - `chunk-7zW9nmZq.js`: 0.8KB — 小（必須）
  - `chunk-CSR4GYvN.js`: 0.7KB — 小
  - `index.CcIz_-q1.js`: 11KB — エントリ（必須）
- Redux chunk はサインイン/投稿フォームでのみ使用

## Proposed Solutions

### A: SSR マニフェストから Redux chunk を除外
- `ssr.ts` の modulepreload 解決ロジックで、ホームルートに Redux chunk を含めない
- **工数:** 低

### B: Redux を完全に dynamic import 化
- `redux-form` を使う箇所だけで `import()` する
- Vite の manualChunks で vendor-redux を分離済みなので、modulepreload リストから外すだけで良い
- **工数:** 低

## Recommended Action

A — SSR の modulepreload リストからホームで不要なチャンクを除外

## Acceptance Criteria

- [ ] ホームの modulepreload から Redux chunk が除外される
- [ ] ホームの初期DLサイズが 18KB br 削減
- [ ] サインイン・投稿フォームが引き続き動作する
- [ ] VRT パス

## Work Log

### 2026-03-21 - 作成

**By:** Claude Code

**Actions:**
- modulepreload 7チャンクの内容とサイズを特定
- Redux chunk がホームで不要であることを確認
