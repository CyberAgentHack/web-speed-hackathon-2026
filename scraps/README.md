# WSH 攻略ガイド

> [!TIP]
>
> 参照するだけで戦える魔法のガイド。競技中はまずここを読む。

## AI エージェント設定ファイル

リポジトリルートに以下のファイルがある。

| ファイル | 内容 |
|---------|------|
| [`../AGENTS.md`](../AGENTS.md) | AI エージェント向けの設定。インストール済みスキルの一覧・呼び出しタイミング・ドキュメントの読み方を記載 |
| `../skills-lock.json` | インストール済みスキルのバージョンロックファイル (`pnpm dlx skills experimental_install` で参照され、`.agents/skills/` が生成される) |

**Claude Code を使っている場合**、`AGENTS.md` は自動で読まれないためシンボリックリンクを貼る:

```bash
ln -s AGENTS.md CLAUDE.md
```

## ドキュメント構成

| ファイル | 内容 | 使うタイミング |
|---------|------|--------------|
| [checklist.md](./checklist.md) | 競技中に上から順に実行する実践手順書 (Phase 0〜8) | **競技中メインで使う** |
| [traps.md](./traps.md) | 失格・罠パターン集 + 毎年仕込まれる罠テーブル | 競技中・最終確認前 |
| [years.md](./years.md) | 年度別のアプリ詳細・仕込み問題・参加記まとめ | 傾向把握・事前学習 |
| [urls.md](./urls.md) | 参考にした記事・参加記の URL 一覧 | 詳細を調べたいとき |

## 目次

- [コンテストの概要](#コンテストの概要)
- [スコア計算式 (年度別)](#スコア計算式-年度別)
- [戦略の全体像](#戦略の全体像)
- [メトリクス別対策](#メトリクス別対策)
- [インフラ選択の実績](#インフラ選択の実績)
- [分析・計測ツール](#分析計測ツール)
- [ビルドツール](#ビルドツール)
- [ライブラリ代替一覧](#ライブラリ代替一覧)
- [バンドルサイズ目標](#バンドルサイズ目標)
- [画像最適化ツール](#画像最適化ツール)
- [フォント最適化ツール](#フォント最適化ツール)
- [動画・音声ツール (FFmpeg)](#動画音声ツール-ffmpeg)
- [HTTP 圧縮](#http-圧縮)
- [DB 最適化](#db-最適化)
- [ReDoS チェック](#redos-チェック)
- [CSS テクニック](#css-テクニック)
- [よく効いた最適化のスコア改善量](#よく効いた最適化のスコア改善量-実績)
- [会場参加時の持ち物・準備](#会場参加時の持ち物準備)
- [コンテスト参加の流れ](#コンテスト参加の流れ)
- [学習リソース](#学習リソース)

---

## コンテストの概要

- **形式**: 意図的に低速化された React アプリを高速化する競技 (ISUCON のフロント版)
- **ルール**: 見た目が変わらなければ何をしてもよい。API 変更・フロント変更・インフラ変更すべて OK
- **失格条件**: UI 崩れ・ページ不到達・VRT 失敗・レギュレーション違反
- **採点**: GitHub Actions で Lighthouse を自動実行。提出 URL を計測
- **AI ツール**: ルールに明記なし (2025 年時点)。ChatGPT 等の過去利用実績あり

---

## スコア計算式 (年度別)

### 2025 年 (1200 点満点)

```
① ページ表示 (900 点 = 9 ページ × 100 点)
   FCP×10 + SI×10 + LCP×25 + TBT×30 + CLS×25

② ユーザーインタラクション (200 点 = 4 シナリオ × 50 点)
   TBT×25 + INP×25

③ 動画再生 (100 点 = 2 シナリオ × 50 点)
   t_mod = max(0, t - 800)  ← t はページロードから playing イベントまでの ms
   score = (1 - t_mod / (t_mod + 3000)) × 50
   ※ t ≥ 20,000ms → 0 点
```

> [!IMPORTANT]
>
> ①のページ表示スコアが **200 点以上** でないと②と③の計測が行われず 0 点になる。

計測対象ページ: ホーム / 番組表 / 番組(放送前・中・後) / シリーズ / エピソード(無料・プレミアム) / 404

### 2024 年 (700 点満点)

```
ページランディング (400 点 = 4 ページ × 100 点):
  FCP×10 + SI×10 + LCP×25 + TBT×30 + CLS×25

ユーザーフロー (300 点 = 6 フロー × 50 点):
  TBT×25 + INP×25
```

計測対象ページ: ホーム / 作者詳細 / 作品詳細 / エピソード(漫画ビューア)

### 2022 年 (500 点満点)

```
FCP×10 + SI×10 + LCP×25 + TTI×10 + TBT×30 + CLS×15
= 最大 100 点 × 5 ページ
```

計測対象ページ: ホーム / エントリー表 / オッズ(2 種) / 結果ページ
**⚠️ 注意**: `/` ではなく `/:date` が計測対象。毎年ページを間違えて時間をロスする事例あり。

### 2020 年 (~575 点満点)

```
Lighthouse v6 の Performance Score (0〜100) × 5 ページ
メトリクス重み: FCP×3 + SI×3 + LCP×5 + TTI×3 + TBT×5 + CLS×1
```

**TBT と LCP の配点が常に最大。絶対に落とせない。**

---

## 戦略の全体像

```
Phase 1: ビルド設定の修正 (スコア 2〜5 倍)
  └─ production mode / source map / polyfill

Phase 2: バンドルサイズ削減 (スコア 3〜10 倍)
  └─ 重いライブラリ削除 / 動的 import / コード分割

Phase 3: 意図的な遅延の除去 (スコア 1.5〜2 倍)
  └─ p-min-delay / グローバルマウス追跡 / setInterval

Phase 4: アセット最適化 (スコア 1.5〜3 倍)
  └─ 画像 / 動画・音声 / フォント

Phase 5: バックエンド・ネットワーク最適化 (スコア 1.5〜2 倍)
  └─ DB インデックス / API 削減 / CDN / キャッシュ

Phase 6: CDN / インフラ (スコア 1.3〜1.5 倍)
  └─ Cloudflare HTTP/2・HTTP/3・Brotli

Phase 7: React レンダリング最適化 (スコア 1.2〜1.5 倍)
  └─ SSR / 再レンダリング抑制 / CLS 対策

Phase 8: 最終確認 (失格回避)
  └─ VRT / 全ページ手動確認
```

---

## メトリクス別対策

### TBT (配点最大)

- **Long Task (50ms 超) を分割する** ← これだけで大きく改善
- **60fps = 1 フレームあたり 17ms**。これを超える JS 処理はカクつきを招く
- `requestIdleCallback` でスケジューリング
- JavaScript の実行量を削減 (ライブラリ削除が最効果)
- CSS アニメーションに置き換える

### LCP (配点 2 位)

- LCP 要素の画像を特定し `loading="eager"` (デフォルト)
- `<link rel="preload" as="image">` で先読み (**LCP 画像 1 枚のみ**。多用すると他リソースをブロックして逆効果)
- `fetchpriority="high"` 属性でブラウザの優先度を上げる
- SSR で HTML に画像 URL を埋め込む

### CLS

- 画像に `width`/`height` 属性を指定
- SSR またはスケルトン UI で事前スペース確保
- `overflow-y: scroll` でスクロールバー常時表示

### FCP

- SSR で初期 HTML に内容を含める
- クリティカル CSS をインライン化
- レンダーブロッキングリソースを排除 (`defer`/`async`)
- `preconnect`/`preload` の多用を避ける (FCP が悪化する場合あり)

### INP

- メインスレッドの処理を減らす (Long Task の分割)
- イベントハンドラを軽量化する

---

## インフラ選択の実績

| サービス | 特徴 | 実績 |
|---------|------|------|
| Heroku | 簡単 | HTTP/2 非対応、高コスト。2022 年は満点に届かない場合あり |
| Cloudflare | HTTP/2・HTTP/3・Brotli・CDN | 上位陣が採用、2025 年優勝者も使用 |
| Cloudflare Pages | 静的ファイル CDN 配信 | フロント分離に有効。動的は Workers が必要 |
| Linode/VPS | フルコントロール | HTTP/2 サーバープッシュ可能。2022 年満点達成者が使用 |
| Koyeb | 無料枠あり | レイテンシ注意 |
| Railway | $5 無料クレジット・Docker 対応・操作が簡単 | フロント＋バックエンド一体デプロイも可 |

**採点サーバーのリージョン**: GitHub Actions は Azure East US 付近が多い → デプロイ先をそこに近いリージョンにすると RTT が最小化される。

**Cloudflare で HTML もキャッシュする設定**:

```
# Cloudflare ルール (Page Rules または Transform Rules)
URL: example.com/*
Cache Level: Cache Everything
Edge Cache TTL: 1 hour
```

> [!WARNING]
>
> **`POST /api/initialize` について**: 採点サーバーは計測前に DB を初期化する。この API を壊してはいけない。DB の内容を変更してスコアを上げようとしても、採点前にリセットされるので意味がない。

---

## 分析・計測ツール

| ツール | 用途 | 使い方 |
|-------|------|--------|
| `webpack-bundle-analyzer` | webpack バンドルの可視化 | `npx webpack-bundle-analyzer stats.json` |
| `rollup-plugin-visualizer` | Vite/Rollup バンドルの可視化 | vite.config.ts に追加 |
| `rsdoctor` | Rspack バンドルの可視化 | Rspack プラグインとして追加 |
| esbuild analyzer / bundle-buddy.com | esbuild/tsup のバンドル可視化 | metafile を bundle-buddy.com に投入 |
| Chrome DevTools > Network | 重いリクエストの特定 | Size でソートして上位を確認 |
| Chrome DevTools > Performance | Long Task の特定 | CPU 6x slowdown で計測 |
| Chrome DevTools > Coverage | **未使用 JS/CSS の検出** | DevTools > ... > Coverage タブ |
| Chrome DevTools > Lighthouse | スコア計測 | モバイル・シミュレートネットワークで計測 |
| React Scan | 再レンダリングの多い箇所を可視化 | `import { scan } from 'react-scan'; scan({ enabled: true })` |
| React DevTools Profiler | コンポーネント単位の再レンダリング確認 | "Highlight updates when components render" を有効化 |
| **Bundlephobia** | npm パッケージのサイズ確認 | bundlephobia.com でパッケージ名検索 |
| **`npm ls {パッケージ名}`** | 依存チェーンを確認 | 隠れた重いパッケージ (bluebird 等) を発見 |

---

## ビルドツール

| ツール | 特徴 | 選択基準 |
|-------|------|---------|
| Vite | 高速・チャンク分割が容易 | 新規・移行推奨 |
| Rspack | webpack 互換で高速 (4〜6 倍) | webpack から移行しやすい |
| webpack | 安定・プラグインが豊富 | 既存コードとの互換性重視 |
| tsup | TypeScript ライブラリ向け | 小規模・サーバーサイド向け (**IIFE 形式ではコード分割不可**) |

---

## ライブラリ代替一覧

| 削除 | 代替 | 削減量 |
|------|------|--------|
| `moment` / `moment-timezone` | `day.js` | ~280KB |
| `lodash` (全体 import) | ネイティブ JS / `lodash-es` named import | ~70KB |
| `axios` | `fetch` (エラーハンドリングの挙動差異に注意) | ~13KB |
| `jQuery` | `document.querySelector` + `fetch` | ~87KB |
| `framer-motion` | CSS animation | ~100KB |
| `zod` | `valibot` | ~40KB |
| `luxon` | `day.js` | ~70KB |
| `unicode-collation-algorithm2` | `Intl.Collator` | ~1MB |
| FFmpeg WASM | サーバー事前生成 | ~30MB |
| `core-js` 全体 | browserslist で自動削減 | ~50KB〜 |
| React | Preact (`react` → `preact/compat` alias) | ~100KB |

---

## バンドルサイズ目標

| ファイル | 目標 |
|---------|------|
| JS (クライアント) | < 500KB (可能なら < 200KB) |
| CSS | < 50KB |
| 初期 HTML | < 50KB |
| 合計転送量 (初回) | < 1MB |

Google の推奨: **JS バジェット 170KB 以下**

---

## 画像最適化ツール

| ツール | 用途 | コマンド例 |
|-------|------|-----------|
| `sharp` (Node.js) | 高品質な変換・リサイズ | `sharp(input).avif({ quality: 60 }).toFile(output)` |
| ImageMagick | 一括変換 | `magick mogrify -format avif -quality 60 *.jpg` |
| Squoosh CLI | 細かいパラメータ調整 | `npx @squoosh/cli --avif '{"quality":60}' image.jpg` |

**圧縮品質の目安**:
- AVIF quality 60: 元の 5〜10% のサイズ、画質は十分
- WebP quality 75: 元の 15〜25% のサイズ
- JPEG quality 60: 元の 20〜30% のサイズ

---

## フォント最適化ツール

| ツール | 用途 | コマンド例 |
|-------|------|-----------|
| `subset-font` | フォントのサブセット化 | `npx subset-font input.woff2 --text "あいう..." -o out.woff2` |
| `pyftsubset` | 高機能サブセット化 | `pyftsubset font.ttf --text-file=chars.txt --flavor=woff2` |
| `woff2_compress` | TTF → WOFF2 変換 | `woff2_compress font.ttf` |
| Google Fonts `&text=` | 必要文字だけ取得 | `fonts.googleapis.com/css2?family=X&text=必要文字` |

---

## 動画・音声ツール (FFmpeg)

```bash
# WebM/AV1 変換
ffmpeg -i input.mp4 -c:v libaom-av1 -crf 30 output.webm

# 音声 → Opus 変換 (mp3/aac より大幅に軽い)
ffmpeg -i input.mp3 -c:a libopus -b:a 64k output.webm

# GIF → WebM
ffmpeg -i input.gif -c:v libvpx-vp9 output.webm

# サムネイル生成
ffmpeg -i input.mp4 -ss 00:00:01 -vframes 1 thumbnail.avif

# HLS セグメント生成 (長い動画のストリーミング向け)
ffmpeg -i input.mp4 -c:v h264 -hls_time 6 -hls_playlist_type vod output.m3u8

# リサイズ
ffmpeg -i input.mp4 -vf scale=720:-1 output.mp4
```

---

## HTTP 圧縮

```bash
# Express
npm install compression shrink-ray-current

# Fastify
npm install @fastify/compress
```

```ts
// Fastify
import compress from '@fastify/compress';
app.register(compress, { global: true, encodings: ['gzip', 'br'] });
// ⚠️ リアルタイム Brotli はサーバー負荷が高い → Cloudflare に任せる方が安全
```

| ツール | 説明 |
|-------|------|
| `compression` | Express 用 gzip/deflate |
| `shrink-ray-current` | Express 用 Brotli (gzip 比 15〜25% 削減) |
| `compression-webpack-plugin` | ビルド時に gzip ファイルを事前生成 |
| `brotli-webpack-plugin` | ビルド時に brotli ファイルを事前生成 |
| `@fastify/compress` | Fastify 用圧縮 |

---

## DB 最適化

```sql
-- インデックスの追加 (Drizzle ORM + SQLite の場合)
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column1, column2);

-- クエリの確認
EXPLAIN QUERY PLAN SELECT ...;

-- 実行時間計測
.timer on
SELECT ...;
```

---

## ReDoS チェック

毎年ログイン・バリデーションに ReDoS 脆弱性が仕込まれている。

```ts
// 典型的な NG パターン (指数関数的バックトラック)
/^([a-zA-Z0-9])+@/

// OK: シンプルに書き直す
/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// さらに OK: HTML5 標準の email バリデーションに任せる
type="email"
```

チェックツール: devina.io/redos-checker、regex101.com (catastrophic backtracking の警告)

---

## CSS テクニック

```css
/* オフスクリーンのセクションのレンダリングをスキップ */
.section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px; /* 推定高さ */
}
```

```js
// postcss.config.js の典型的な修正
// preserve: false を忘れると変換前後の両方が出力されてコードが 2 倍に
require('postcss-custom-properties')({ preserve: false }),
require('postcss-calc'),
require('cssnano'),
```

---

## よく効いた最適化のスコア改善量 (実績)

| 最適化 | 典型的な改善量 |
|--------|-------------|
| webpack production mode | JS が 90% 削減 |
| FFmpeg WASM 削除 | バンドル -30MB |
| SVG base64 フォント削除 | -5MB |
| UnoCSS 静的化 | バンドル -数 MB |
| recommended API 削減 | 57MB → 1MB |
| 画像 AVIF 変換 | -92% |
| DB インデックス | API レスポンス 3500ms → 400ms |
| p-min-delay 削除 | -1000ms |
| Cloudflare 導入 | HTTP/2・Brotli で大幅改善 |
| SSR 実装 | FCP が大幅改善 |

---

## 会場参加時の持ち物・準備

- **PC と電源ケーブル・延長ケーブル** (忘れがち)
- 名刺 (持っていない場合は受付時に申告)
- やること・気づきをメモするノート (紙 or スマホから編集できる電子メモ)
- カフェイン・糖分の飲み物 (コーヒー・緑茶・エナジードリンク等。会場にフリードリンクあり)
- お菓子 (チョコレート・ナッツ等)
- **食事を事前に用意する** (開始後は外食不可になる場合がある)

## 事前準備 (競技前日まで)

- [ ] 最新版 Chrome をインストール
- [ ] IDE / エディタのセットアップ
- [ ] 過去問を解いて感覚をつかんでおく
- [ ] テーマ (架空サービスのジャンル) から予想して関連技術を予習しておく
  - 例: 動画配信サービス → HLS・動画プレイヤー・Brotli
- [ ] レギュレーション (生成 AI 使用可否・採点方法) を確認しておく

## コンテスト参加の流れ

1. リポジトリを fork
2. 任意の URL にデプロイ
3. スコアリングリポジトリの GitHub Issues から URL を登録
4. GitHub Actions で自動計測・リーダーボード更新
5. チューニング → 計測 を繰り返す
6. 競技終了後も URL へのアクセスを維持 (レギュレーションチェックのため)

---

## 学習リソース

| リソース | 用途 |
|---------|------|
| 『Web フロントエンドハイパフォーマンスチューニング』 | 初心者が最初に読む本 |
| Chrome DevTools ドキュメント | Lighthouse 指標の公式説明 |
| youmightnotneed.com | lodash の代替手法を調べる |
| bundlephobia.com | npm パッケージのサイズ確認 |
| devina.io/redos-checker | ReDoS 脆弱性チェック |
| bundle-buddy.com | esbuild のバンドル分析 |
| free-for.dev | 無料 SaaS 一覧 (インフラ選択時) |
