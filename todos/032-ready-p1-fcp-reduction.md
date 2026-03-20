---
status: ready
priority: p1
issue_id: "032"
tags: [performance, lighthouse, fcp, bundle]
dependencies: []
---

# 全ページ FCP 1.9〜2.1秒を改善する

## Problem Statement

全ページの FCP が 1,870ms〜2,146ms で、2秒前後に張り付いている。Initial JS が 257KB あり、ブラウザのパース・実行時間が FCP を押し上げている。

## Findings

- **Lighthouse (median):** home FCP=2,146ms, post=1,870ms, search=2,002ms, terms=1,961ms
- **Bundle:** Total=3.56MiB, Initial JS=257.1KB (index.BuXhpjZS.js), Chunks=527, Packages=118
- **Top assets:** chunk-AoJJNzE9.js=316.5KB, index(initial)=257.1KB, chunk-BWmlHbA-=118.1KB
- KaTeX フォント 2ファイル (62KB + 52KB) がバンドルに含まれる
- TBT は 0〜22ms なので JS 実行後の blocking は少ない — 初期ロードのパース時間が支配的
- **post_audio の FCP が 2,111ms** — post(1,870ms) より 240ms 遅い。音声プレーヤー初期化コストが上乗せされている可能性

## Acceptance Criteria

- [ ] 全ページの FCP が 1,500ms 以下
- [ ] Initial JS が 200KB 以下
- [ ] VRT が通ること

## Work Log

### 2026-03-20 - Bench 計測結果記録

**By:** Claude Code

**Actions:**
- frontend.sh でバンドル分析: 3.56MiB, Initial JS 257KB
- Lighthouse 7ページ計測: FCP 1,870〜2,146ms

**Learnings:**
- Initial JS 257KB の内訳分析が必要（何が含まれているか）
- KaTeX フォントは遅延ロード候補
- chunk-AoJJNzE9.js (316KB) の中身を特定して分割/遅延ロード検討
