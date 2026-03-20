---
status: ready
priority: p2
issue_id: "035"
tags: [performance, video, cache, transfer-size]
dependencies: []
---

# 動画ファイルのキャッシュとサイズ最適化

## Problem Statement

トレースで mp4 動画ファイルがキャッシュされておらず、毎回フルダウンロードしている。合計 586KB がキャッシュなしで転送されており、Total transfer (637KB) の **92%** が動画。ページ全体の転送量を大幅に増加させている。

## Findings

- **トレースデータ:**
  - `/movies/51a14d70-...mp4`: 411.5KB, キャッシュなし, @553ms
  - `/movies/7518b1ae-...mp4`: 174.4KB, キャッシュなし, @7753ms
  - `/movies/1b558288-...mp4`: @8517ms, ダウンロード完了前にトレース終了
  - `/movies/b44e6ef6-...mp4`: @8602ms, ダウンロード完了前にトレース終了
- **対比:** 画像ファイルはすべてキャッシュヒット（TTFB 2-15ms）
- **影響:** 非キャッシュ転送量の大半を占める

## Proposed Solutions

### Option 1: mp4 に Cache-Control ヘッダー追加

**Approach:** `/movies/` パスに `public, max-age=86400` を設定（アップロードコンテンツと同等）。

**Pros:**
- 2回目以降のアクセスでキャッシュヒット
- 実装が最も簡単

**Cons:**
- 初回ダウンロードは改善しない

**Effort:** 15 min

**Risk:** Low

---

### Option 2: 動画の遅延読み込み最適化

**Approach:** viewport外の動画に `loading="lazy"` + `preload="none"` を設定し、初期ロード時のダウンロードを抑制。

**Pros:**
- 初期ページロードの転送量を大幅削減
- LCP/SI への悪影響なし（動画は below-the-fold）

**Cons:**
- スクロール時にバッファリング発生

**Effort:** 30 min

**Risk:** Low

---

### Option 3: 動画圧縮・フォーマット最適化

**Approach:** mp4 を WebM(VP9) に変換、またはビットレート/解像度を調整して軽量化。

**Pros:**
- 転送サイズ自体を削減
- すべてのアクセスで効果

**Cons:**
- 画質劣化リスク（VRT注意）
- エンコードツール必要

**Effort:** 2-3 hours

**Risk:** Medium（VRT要確認）

## Recommended Action

Option 1 + Option 2 を併用。キャッシュヘッダー追加は即効性あり。viewport外動画の遅延読み込みで初期転送を削減。

## Acceptance Criteria

- [ ] 動画ファイルに適切な Cache-Control が設定される
- [ ] 2回目アクセスでキャッシュヒットすること
- [ ] viewport外の動画が初期ロードでダウンロードされないこと
- [ ] VRT テストが通ること

## Work Log

### 2026-03-20 - トレース分析で発見

**By:** Claude Code

**Actions:**
- トレースの ResourceFinish イベントから動画の転送状況を確認
- 4つの mp4 ファイルがキャッシュなしで配信されていることを発見
- 画像は正常にキャッシュされているのに動画だけキャッシュされていない点を特定

**Learnings:**
- Total transfer 637KB のうち 586KB (92%) が動画
- サーバーの Cache-Control 設定で `/movies/` パスが漏れている可能性
