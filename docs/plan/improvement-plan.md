# CaX パフォーマンス改善計画 v4

---

## ワークフロー

```
コード修正 → ビルド → 計測 (scoring-tool) → 採用/不採用 → ログ記録 → 次
```

### コマンド早見表

```bash
# ビルド & 起動
cd application && pnpm --filter @web-speed-hackathon-2026/client build && pnpm run start

# 計測（別ターミナル）
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000 --targetName "ホーム"

# VRT (e2eパッケージから実行、並列数を制限)
cd application && E2E_WORKERS=1 pnpm --filter @web-speed-hackathon-2026/e2e test
# スクリーンショット取り直し (初回 or 環境変更時)
cd application && E2E_WORKERS=1 pnpm --filter @web-speed-hackathon-2026/e2e test:update
```

### 計測方針

- **ホームに限定した変更** → `--targetName "ホーム"` で高速計測
- **フローや他ページに触る変更** → フル計測 (全9ページ + 5フロー)
- Lighthouse はブレるため、悪化判定は複数回計測で確認

---

## 採点構造

| 区分 | 満点 | 内訳 | 条件 |
|------|------|------|------|
| ページの表示 | 900点 | 9ページ × 100点（FCP×10, SI×10, LCP×25, **TBT×30**, CLS×25） | - |
| ページの操作 | 250点 | 5シナリオ × 50点（**TBT×25**, INP×25） | 表示300点以上で解放 |
| **合計** | **1150点** | | |

**TBT が最重要** (表示30% + 操作50%)

---

## 現状スコア (提出 2026-03-21 — 637.35 / 1150)

### 通常テスト (535.35 / 900)

| ページ | CLS | FCP | LCP | SI | TBT | 合計 |
|--------|-----|-----|-----|-----|-----|------|
| ホーム | 19.50 | 7.40 | **0.00** | **0.00** | **0.00** | **26.90** |
| 投稿詳細 | 25.00 | 8.90 | 7.00 | 9.40 | 27.60 | 77.90 |
| 写真つき投稿詳細 | 24.75 | 8.90 | 0.25 | 8.50 | 29.70 | 72.10 |
| 動画つき投稿詳細 | 23.50 | 8.90 | 7.00 | 7.40 | 18.30 | 65.10 |
| 音声つき投稿詳細 | 25.00 | 8.90 | 7.25 | 8.10 | **0.00** | 49.25 |
| 検索 | 25.00 | 8.60 | 7.00 | 8.90 | 30.00 | 79.50 |
| DM一覧 | 25.00 | 8.80 | 15.75 | 6.50 | 9.00 | 65.05 |
| DM詳細 | 25.00 | 9.00 | 9.00 | 3.10 | **0.00** | 46.10 |
| 利用規約 | 25.00 | 8.90 | 7.75 | 8.50 | 3.30 | 53.45 |

### ユーザーフローテスト (102.00 / 250)

| テスト | INP | TBT | 合計 |
|--------|-----|-----|------|
| ユーザー登録→サインアウト→サインイン | 5.00 | 0.00 | 5.00 |
| DM送信 | - | - | **計測不可** |
| 検索→結果表示 | 25.00 | 22.00 | 47.00 |
| Crok AIチャット | 25.00 | 0.00 | 25.00 |
| 投稿 | 25.00 | 0.00 | 25.00 |

### ボトルネック分析

| 問題 | 推定失点 | 根本原因 |
|------|---------|----------|
| TBT = 0 のページ多数 (ホーム,音声,DM詳細) | **~150点** | 重い依存(kuromoji/negaposi WASM, redux-form)がメインスレッドをブロック |
| LCP が全体的に低い (0〜15.75) | **~120点** | 画像配信の最適化不足、プリロードなし |
| DM送信フロー計測不可 | **~31点** | ローカルでは動くが提出環境でタイムアウト |
| ユーザー登録 INP=5, TBT=0 | **~36点** | redux-form + AuthModal の初期化コスト |
| ホーム CLS=19.5, LCP/SI/TBT=0 | **~27点** | CLS: 画像サイズ未指定、TBT: 重い同期チャンク |

---

## Phase 3: 新プラン (v4)

> 原則: 「TBT 全ページ改善」→「LCP 全ページ改善」→「壊れたフロー安定化」→「追加最適化」

### Step 2: TBT 全ページ改善 (期待 +150〜200点)

TBT は表示 30% + 操作 50% を占める最重要指標。現在 0pt のページが複数ある。

#### S2-01: negaposi/kuromoji/BM25 サーバーサイド化

**対象**: `negaposi_analyzer.ts`, `bm25_search.ts`, `kuromoji_loader.ts`
- サーバーに `/api/v1/sentiment` エンドポイント作成
- クライアント側の kuromoji, negaposi-analyzer-ja, bayesian-bm25 依存を削除
- kuromoji辞書 (17MB) のクライアント配信停止
- 検索ページ, ホームの TBT に直結
- 計測: ホーム計測 + フル計測

#### S2-02: `react-syntax-highlighter` Light ビルド化

**対象**: `CodeBlock.tsx`
```ts
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
SyntaxHighlighter.registerLanguage("javascript", js);
```
全言語定義 (~1 MiB) → 必要な言語のみ。Crok 以外のページに混入していないか確認。
計測: ホーム計測

#### S2-03: Crok 専用依存の async chunk 分離確認

katex / react-markdown / react-syntax-highlighter / rehype-katex / remark-math / remark-gfm が
Crok async チャンクに正しく入っているか確認。入っていなければ cacheGroups で分離。
計測: ホーム計測

#### S2-04: `@mlc-ai/web-llm` の影響確認

**対象**: `create_translator.ts` 経由のインポート
- web-llm が同期チャンクに含まれていないか確認
- 含まれていれば dynamic import 化 or Crok チャンクに隔離
- 計測: ホーム計測

#### S2-05: `standardized-audio-context` 削除検討

音声つき投稿の TBT=0 に関与している可能性。Web Audio API に直接置換。
計測: `--targetName "音声つき投稿詳細ページを開く"`

### Step 3: redux-form 撤去 (期待 +30〜50点)

#### S3-01: redux-form → React controlled form に置換

**対象**:
- `AuthModalPage.tsx` (サインイン/サインアップフォーム)
- `SearchPage.tsx` (検索フォーム)
- `NewDirectMessageModalPage.tsx` (DM送信フォーム)
- `store/index.ts` (redux-form reducer 除去)

redux-form (~30KB gzipped) はメインバンドルに含まれ全ページの TBT に影響。
ユーザー登録フローの INP=5 / TBT=0 はここが主因。
バンドル削減と操作系フローの両方に効く。
計測: フル計測

### Step 4: LCP 全ページ改善 (期待 +80〜120点)

#### S4-01: サーバーAPIから width/height/alt を返す

- Image API レスポンスに `width`, `height` を追加
- CoveredImage に明示的な `width`/`height` を設定
- CLS 改善 (ホーム 19.5→25) + LCP 改善
- 計測: フル計測

#### S4-02: 画像プリロード + loading="lazy"

- ファーストビュー画像に `<link rel="preload">`
- ファーストビュー外の画像に `loading="lazy"`
- ホームの SI/LCP 改善に寄与
- 計測: フル計測

#### S4-03: 適切な画像サイズ配信 (srcset/sizes)

- サーバーサイドでリサイズ済み画像を生成
- `<img srcset>` で適切なサイズを配信
- LCP 改善（転送サイズ削減→速い描画）
- 計測: フル計測

### Step 5: DM送信フロー安定化 (期待 +31点)

提出環境で「2通目のメッセージの送信完了を待機中にタイムアウト」。
ローカルでは動く (37/50) が提出環境で失敗する。
- ネットワーク遅延への耐性向上
- redux-form 除去 (Step 3) 後に再検証
- 計測: フル計測

### Step 6: API レスポンス最適化 (期待 +20〜40点)

#### S6-01: 不要フィールド削除 + ネスト削減

**対象**: ホーム, 投稿詳細, DM一覧/詳細, 検索 API
- above-the-fold に不要なフィールドを削除
- JSON パース時間短縮 → TBT 改善
- 計測: フル計測

#### S6-02: DB インデックス追加

- API レスポンスタイム短縮 → TTFB → LCP 改善
- 計測: フル計測

### Step 7: フォント最適化 (期待 +10〜20点)

#### S7-01: OTF → WOFF2 + サブセット

- `public/fonts/ReiNoAreMincho-*.otf` (計12.7 MiB) → WOFF2 + サブセット
- `/terms` ページで使用する文字のみに絞る
- 目標: 12.7 MiB → ~200-500 KB
- 利用規約ページの LCP/SI に効く
- 計測: `--targetName "利用規約"` + フル計測

### Step 8: 追加最適化 (時間に余裕がある場合)

#### S8-01: `<link rel="preload">` — CSS, クリティカルフォント
#### S8-02: `splitChunks.maxSize` で並列ダウンロード最適化
#### S8-03: SSR 導入

> **SSR は docs/research でもハイリスク。** WSH2025 では16人中15人がハイドレーション崩れで失格。
> 重依存除去と API 軽量化が終わるまで触らない。

---

## 期待スコア推移

| Step | 期待獲得 | 累計予想 |
|------|---------|---------|
| 現状 | - | 637.35 |
| Step 2 (TBT改善) | +150〜200 | ~810 |
| Step 3 (redux-form) | +30〜50 | ~850 |
| Step 4 (LCP改善) | +80〜120 | ~940 |
| Step 5 (DM安定化) | +31 | ~970 |
| Step 6 (API最適化) | +20〜40 | ~1000 |
| Step 7 (フォント) | +10〜20 | ~1015 |
| Step 8 (追加最適化) | +20〜40 | ~1040 |

---

## 実装済みタスク一覧

### Phase 0 (ビルド基盤)
- [x] T01: webpack `mode:"production"` + `minimize:true` + `devtool:false`
- [x] T02: `splitChunks: { chunks: "all" }` + tree shaking フラグ有効化
- [x] T03: Babel ターゲット Chrome 130 + core-js/regenerator 除去
- [x] T04: GIF → MP4 変換 (15ファイル)
- [x] T05: JPG → WebP 変換 (60ファイル)
- [x] T06: Tailwind CDN → ビルドタイム (@tailwindcss/postcss)
- [x] T07: jQuery/bluebird/pako/moment/lodash 除去 → fetch API / Intl API
- [x] T08: FFmpeg/ImageMagick 動的import化
- [x] T09: kuromoji/BM25/negaposi-analyzer 動的import化
- [x] T10: `<script defer>`, `font-display: swap`, ProvidePlugin 削除

### Phase 1 (計測可能化)
- [x] P1-01: `asset/bytes` → `asset/resource` に変更 (-44.6 MiB)
- [x] P1-02: Babel `modules:false` + `development:false`
- [x] P1-03: `NewPostModalContainer` を lazy load 化
- [x] P1-04: `CoveredImage` から `image-size` / `piexifjs` 動的import化

### Phase 2 (サーバーサイド + FCP修正)
- [x] P2-01: `compression()` ミドルウェア追加
- [x] P2-02: キャッシュヘッダー最適化 (API no-store / 静的 etag + immutable)
- [x] P2-03: 即時レンダリング (`window.load` 待ち除去)
- [x] FCP修正: `publicPath: "/"` + `inject: "head"` + `scriptLoading: "defer"`

### Step 1 (フロー修復)
- [x] S1-01: 検索フロー修復 (aria-label一致 + useSearchParams切替 + ReDoS修正)
- [x] S1-02: DM送信フロー修復 (楽観的更新 + loadConversation非同期化)
- [x] S1-03: 投稿フロー修復 (alt抽出 + ffmpeg cropフィルタ修正 + エラーハンドリング)
- [x] S1-04: AuthModal型修正 (HttpError クラス + 構造化エラー保持)

### 不採用 / キャンセル済み
- [x] フォント最適化 (利用規約用分離案) → ホーム改善なし → CANCEL
- [x] キャッシュヘッダー再調整 → ホームで悪化 → CANCEL

---

## レギュレーション遵守チェック (毎改善後に実施)

| # | チェック項目 | コマンド/方法 |
|---|-------------|---------------|
| 1 | VRT テスト | `cd application && E2E_WORKERS=1 pnpm --filter @web-speed-hackathon-2026/e2e test` |
| 2 | 手動テスト主要項目 | `docs/test_cases.md` を目視確認 |
| 3 | 初期化 API | `curl -X POST http://localhost:3000/api/v1/initialize` |
| 4 | Crok SSE | ブラウザで確認 |
| 5 | fly.toml 未変更 | `git diff fly.toml` |
| 6 | 動画自動再生 | ホーム・投稿詳細で確認 |
| 7 | 音声波形表示 | ホーム・投稿詳細で確認 |
| 8 | 写真表示 | object-fit: cover で表示確認 |

> **重要**: 過去 WSH では上位入賞者の大半がレギュレーション違反で失格。スコア改善よりレギュレーション遵守を優先。
