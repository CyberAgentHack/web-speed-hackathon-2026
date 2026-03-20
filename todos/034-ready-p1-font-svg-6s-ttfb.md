---
status: ready
priority: p1
issue_id: "034"
tags: [performance, font, svg, ttfb, critical-path]
dependencies: []
---

# フォント・SVGスプライトの TTFB 6秒問題を解消する

## Problem Statement

Chrome DevTools トレース（2026-03-20）で、`ReiNoAreMincho-Heavy-subset.woff2` と `solid-subset.svg` の TTFB がそれぞれ **6041ms / 6012ms** と異常に遅い。これらはクリティカルパス上にあり、`Load` イベントを **6161ms** まで遅延させている。FCP(190ms) は良好なのに Load が 6秒かかる原因の大半がこの2ファイル。

## Findings

- **トレースデータ:**
  - `/fonts/ReiNoAreMincho-Heavy-subset.woff2`: @29ms開始 → TTFB=6041ms, 25.5KB, キャッシュなし
  - `/sprites/font-awesome/solid-subset.svg#home`: @149ms開始 → TTFB=6012ms, 7.2KB, キャッシュなし
  - 他のJSチャンク（最大258KB）はすべてキャッシュヒットで TTFB 13-26ms
- **異常な TTFB の考えられる原因:**
  - サーバーサイドで動的 Brotli 圧縮を行っている（圧縮レベルが高すぎる）
  - 静的ファイルのルーティング/ミドルウェアで不要な処理が挟まっている
  - ファイルシステムアクセスの遅延（sqlite コピーやシード処理との競合）
- **影響:** Load イベント 6.1秒 → Lighthouse の Speed Index や Total Blocking Time に悪影響

## Proposed Solutions

### Option 1: Brotli 事前圧縮 + 静的配信キャッシュ

**Approach:** ビルド時に .br / .gz ファイルを事前生成し、サーバーは圧縮済みファイルを返すだけにする。immutable キャッシュヘッダーを付与。

**Pros:**
- TTFB を数ms に短縮可能
- CPU 負荷ゼロ（事前圧縮済み）

**Cons:**
- ビルドステップ追加が必要

**Effort:** 1-2 hours

**Risk:** Low

---

### Option 2: サーバーミドルウェアの調査・修正

**Approach:** Hono の静的ファイル配信パスを確認し、不要なミドルウェア（認証チェック等）がフォント/SVGに適用されていないか調査。

**Pros:**
- 根本原因の特定
- 他のリソースにも波及効果

**Cons:**
- 原因が圧縮でない場合は別のアプローチが必要

**Effort:** 1 hour

**Risk:** Low

---

### Option 3: フォント/SVG を CDN または preload で最適化

**Approach:** `<link rel="preload">` でフォントを早期ロード + `font-display: swap` でブロック回避。SVG はインライン化。

**Pros:**
- FCP/LCP への影響を最小化
- サーバー変更不要

**Cons:**
- TTFB 自体は改善しない（体感改善のみ）

**Effort:** 30 min

**Risk:** Low

## Recommended Action

Option 2（原因調査）→ Option 1（事前圧縮）の順に実施。まずサーバーの静的配信パスを確認し、なぜフォントとSVGだけ6秒かかるか特定する。動的Brotli圧縮が原因であれば事前圧縮に切り替える。

## Technical Details

**調査対象ファイル:**
- `application/server/src/app.ts` — 静的ファイル配信ミドルウェア
- `application/server/src/routes/` — ルーティング設定
- `application/client/src/index.html` または SSR テンプレート — preload ヒント

**対象リソース:**
- `public/fonts/ReiNoAreMincho-Heavy-subset.woff2` (25.5KB)
- `public/sprites/font-awesome/solid-subset.svg` (7.2KB)

## Acceptance Criteria

- [ ] フォントの TTFB が 100ms 以下に短縮
- [ ] SVGスプライトの TTFB が 100ms 以下に短縮
- [ ] Load イベントが 2秒以内に短縮
- [ ] VRT テストが通ること
- [ ] フォント表示に差異がないこと

## Work Log

### 2026-03-20 - トレース分析で発見

**By:** Claude Code

**Actions:**
- `Trace-20260320T174213.json.gz` を解析
- NavigationTiming、ResourceSendRequest/Finish イベントを抽出
- フォント(6041ms)とSVG(6012ms)の TTFB 異常を発見
- 他のJSチャンクはすべてキャッシュヒット(TTFB 13-26ms)であることを確認

**Learnings:**
- FCP(190ms)は良好だが Load(6161ms)が異常に遅い原因はこの2リソース
- JSキャッシュは正常に動作している
- フォントとSVGだけキャッシュされていない → サーバーの配信設定の問題
