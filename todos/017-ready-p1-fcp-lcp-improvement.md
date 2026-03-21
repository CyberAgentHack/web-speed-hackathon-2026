---
status: ready
priority: p1
issue_id: "017"
tags: [scoring, perf, fcp, lcp, ssr, css, streaming]
dependencies: []
---

# FCP/LCP 改善 (全ページ共通)

## Problem Statement

全ページで FCP 3.8-4.6/10、LCP 7.5-16.75/25。特にホームページの LCP が 7.50/25 と低い。
合計で約 50-80点の改善余地がある。

## Findings

### FCP ボトルネック
1. **CSS が外部ファイルでレンダーブロッキング:** `Document.tsx:17` で `<link rel="stylesheet" href={cssHref} />` として配信。クリティカル CSS のインライン化なし
2. **SSR が `allReady` で全データ取得完了まで待機:** `entry-server.tsx:72` で `await stream.allReady` → HTML ストリーミングの利点を殺している
3. **entry-client.tsx が CSS を同期 import:** `import "./index.css"` がエントリモジュールのパース/実行をブロック

### LCP ボトルネック
1. **画像の fetchPriority 最適化不足:** `TimelineItem.tsx:44` で最初の3投稿のみ `priority={true}`
2. **プロフィール画像が常に lazy-load:** `TimelineItem.tsx:22-28` で `loading="lazy"` 固定
3. **ホームの LCP 要素** がテキストまたは画像だが、CSS/JS のブロッキングで描画が遅い

### SI ボトルネック
1. `allReady` による一括描画パターン → Speed Index が低い
2. スケルトン/プレースホルダーなし → 段階的な視覚進行がない

## Proposed Solutions

### Option 1: クリティカル CSS インライン化

**Approach:** ナビゲーション + タイムラインアイテムシェルの CSS を `<style>` タグとしてインライン化。

**Pros:** FCP を 1-2秒改善
**Cons:** HTML サイズ増加
**Effort:** 1-2時間
**Risk:** Medium

### Option 2: SSR ストリーミング最適化

**Approach:** `await stream.allReady` を削除し、React Suspense で段階的にストリーミング。ナビゲーション → コンテンツの順で描画。

**Pros:** FCP + SI 大幅改善
**Cons:** Suspense 境界の設計が必要
**Effort:** 2-3時間
**Risk:** Medium

### Option 3: 画像優先度の最適化

**Approach:** ビューポート内の画像に `fetchPriority="high"` + `loading="eager"` を設定。プロフィール画像の above-the-fold 分も eager に。

**Pros:** LCP 改善
**Cons:** 帯域使用量増加
**Effort:** 30分
**Risk:** Low

## Recommended Action

Option 3（画像優先度）→ Option 2（SSR ストリーミング）→ Option 1（CSS インライン）の順で実施。
低リスクの画像優先度から始め、効果を計測しながら進める。

## Technical Details

**Affected files:**
- `application/client/src/entry-server.tsx` — allReady 削除、ストリーミング制御
- `application/client/src/Document.tsx` — CSS インライン化
- `application/client/src/components/timeline/TimelineItem.tsx` — 画像 priority
- `application/client/src/components/timeline/CoveredImage.tsx` — fetchPriority
- `application/server/src/routes/ssr.ts` — SSR データフェッチ戦略

**現在のスコア:**
| ページ | FCP | LCP | SI |
|--------|-----|-----|-----|
| ホーム | 3.80/10 | 7.50/25 | 7.10/10 |
| 投稿詳細 | 4.60/10 | 16.75/25 | 7.70/10 |
| 検索 | 4.60/10 | 16.00/25 | 7.70/10 |
| 利用規約 | 4.60/10 | 16.00/25 | 7.70/10 |

## Acceptance Criteria

- [ ] 全ページの FCP スコアが 7/10 以上
- [ ] ホームページの LCP スコアが 15/25 以上
- [ ] SI スコアが 9/10 以上
- [ ] VRT が壊れないこと
- [ ] 既存の SSR データ受け渡しが維持されること

## Work Log

### 2026-03-21 - 初回分析

**By:** Claude Code

**Actions:**
- SSR 実装 (entry-server.tsx, ssr.ts) の分析
- CSS 配信戦略の確認
- 画像の priority 設定状況の確認
- Vite ビルド出力サイズの確認
