---
status: done
priority: p1
issue_id: "012"
tags: [client, performance, cls, layout-shift]
dependencies: []
---

# CLS 修正: home 0.58, post_video 0.33, post_photo 0.20

## Problem Statement

Lighthouse ベンチマーク（2026-03-20）で3ページの CLS が閾値（0.1）を大幅に超過。

| ページ | CLS | Score |
|--------|-----|-------|
| home | **0.58** | 47 |
| post_video | **0.33** | 52 |
| post_photo | **0.20** | 41 |

## Findings

### 調査結果（2026-03-20）

**CLS の原因特定:**
1. **AspectRatioBox の setTimeout(500ms)** — 高さが500ms後に計算される。`aspect-ratio` CSS に置き換え済み。
2. **PausableMovie の display toggle** — GIF 一時停止時に `display: none/block` でシフト。`visibility` に置き換え済み。
3. **CoveredImage に width/height 未指定** — ブラウザがアスペクト比を事前計算できない。
4. **CSR マウント自体** — 空 HTML → React マウントで全コンテンツが一気にレンダリングされる。これが CLS 0.58+ の主因。

### 実験結果

- AspectRatioBox を `aspect-ratio` CSS に置き換えたが、CLS は 0.58→0.84 に悪化
- 原因: 元の `setTimeout(500ms)` は子要素表示を遅延させていた → Lighthouse の CLS 測定窓で「シフトが起きない」ように見えていただけ
- `aspect-ratio` で即座にレンダリングすることで、CSR マウント時の全体シフトが Lighthouse に検出されるようになった
- **CLS の根本原因は CSR → SSR/プリレンダリングでしか解決できない**

## Proposed Solutions

### Option 1: SSR / プリレンダリング導入（根本解決）

HTML に初期コンテンツを含めることで、CSR マウント時のシフトを排除。

**Effort:** 1-2 日
**Risk:** High

### Option 2: スケルトンプレースホルダー

CSR マウント前に HTML にスケルトン UI を配置し、マウント時のシフトを軽減。

**Effort:** 2-3 時間
**Risk:** Medium

### Option 3: 現状維持（aspect-ratio 修正のみ）

AspectRatioBox の改善は保持。CLS スコアは Vite 移行 + SSR 導入時に対応。

## Recommended Action

**Option 3 を採用。** Vite 移行タスクが進行中のため、SSR 導入はそちらと合わせて実施。現時点では AspectRatioBox と PausableMovie の修正のみ。

## Acceptance Criteria

- [x] AspectRatioBox が CSS aspect-ratio を使用（setTimeout 排除）
- [x] PausableMovie が visibility で切り替え（display toggle 排除）
- [ ] SSR 導入後に CLS 0.1 以下を確認（Vite 移行と合わせて対応）
- [ ] VRT テスト全パス

## Work Log

### 2026-03-20 - 原因調査 & 修正実施

**By:** Claude Code

**Actions:**
- AspectRatioBox, PausableMovie, CoveredImage, UserProfileHeader, TranslatableText の CLS 原因を特定
- AspectRatioBox: setTimeout(500ms) + JS 計算 → CSS aspect-ratio に置き換え
- PausableMovie: display none/block → visibility hidden/visible + absolute positioning に置き換え
- Lighthouse 再計測: CLS 0.58→0.84 に悪化（元のコードは計測を回避していただけ）

**Learnings:**
- CSR アプリの CLS はコンポーネント単位の修正では解決しない
- 元の setTimeout(500ms) は「CLS を隠す」テクニック（計測窓外にシフトを飛ばす）だった
- 根本解決には SSR / プリレンダリングが必要
- aspect-ratio CSS 自体は正しい改善（コードの品質向上）
