---
status: ready
priority: p1
issue_id: "017"
tags: [perf, home, lcp, image, avif]
dependencies: []
---

# LCP 画像を `<picture>` + AVIF 直接配信に変更

## Problem Statement

LCP画像が JPEG 108KB で配信されている。サーバーサイド Content Negotiation で AVIF 74KB に変換可能だが、`<img src=".jpg">` のみで `<picture>` 未使用。preload にも `type` 指定がないためブラウザが AVIF を事前選択できない。

## Findings

- LCP要素: `/images/029b4b75-bbcc-4aa5-8bd7-e4bb12a33cd3.jpg`
- JPEG: 108KB, AVIF: 74KB（Accept ヘッダベースの Content Negotiation）
- `<link rel="preload" as="image" fetchPriority="high">` あり、type 指定なし
- `CoveredImage` コンポーネントは `<img>` タグのみ
- サーバーの `image_optimization.ts` で AVIF 変換対応済み

## Proposed Solutions

### A: `<picture>` タグ + AVIF srcset
- `<picture><source type="image/avif" srcset="/images/{id}.avif"><img src="/images/{id}.jpg"></picture>`
- preload: `<link rel="preload" as="image" type="image/avif" href="/images/{id}.avif">`
- サーバーに `/images/{id}.avif` エンドポイント追加（Accept ヘッダ不要で直接AVIF返却）
- **工数:** 中

### B: preload に `imagesrcset` + `imagesizes` 追加
- `<picture>` なしでも preload の効率を上げる
- AVIF 指定はできないが、サイズヒントでDL開始を早める
- **工数:** 低（LCP改善効果は A より小さい）

### C: 画像をさらに圧縮
- AVIF の品質パラメータ調整で 74KB → 40-50KB
- 画質とのトレードオフ
- **工数:** 低

## Recommended Action

A + C — `<picture>` で AVIF 直接配信 + 品質調整でサイズ削減

## Acceptance Criteria

- [ ] LCP画像が AVIF で配信される（Chrome）
- [ ] `<link rel="preload" type="image/avif">` が設定される
- [ ] LCP スコアが 7.50 → 15.0 以上
- [ ] JPEG フォールバックが非対応ブラウザで動作
- [ ] VRT パス

## Work Log

### 2026-03-21 - 作成

**By:** Claude Code

**Actions:**
- LCP画像サイズ計測: JPEG 108KB / AVIF 74KB
- preload, CoveredImage, image_optimization.ts を確認
