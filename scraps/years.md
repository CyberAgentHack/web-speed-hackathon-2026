# WSH 年度別詳細

各年度のアプリ仕様・スコア計算式・仕込まれた罠の一覧。

---

## 2020 年 — あみぶろ (Amida Blog)

### アプリ概要
- **テーマ**: シンプルなブログサービス
- **名前**: あみぶろ (amiblog)
- **技術スタック**: JavaScript / CSS / HTML、Webpack、Yarn、Node.js 13+
- **デプロイ**: Heroku Review Apps (PR から自動生成)

### 開催形式
- 4 月: 学生向け採用イベント (70 名以上エントリー)
- 7 月: 社内イベント WIC Speed Hackathon (社員 18 名 + 内定者 12 名)

### スコア計算式
```
学生採用イベント (4月): Lighthouse v5 × 5 ページ (上限 575 点)
社内イベント (7月): Lighthouse v6 × 5 ページ ← イベント直前に v6 リリース
メトリクス重み: FCP×3 + SI×3 + LCP×5 + TTI×3 + TBT×5 + CLS×1
```
※ v5 と v6 でスコアが変わるため、採用イベントと社内イベントのスコアは**直接比較不可**。

### 開催形式の詳細
- **採用イベント**: 4 月 25〜26 日、2 日間オンライン同期型、選考なし
- **社内イベント**: 7 月 21〜22 日、平日 18:00〜21:00 × 2 日 (業務との両立を配慮)
- **作問者**: @nodaguti (ABEMA 所属)
- **2020 年 1 位 @3846masa** → 2021 mini を作問した人物でもある

### 初期状態
- `main.bundle.js` が **15.6 MiB**
- Lighthouse で全ページ **0 点** (表示に 90 秒)

### 参加方法
1. `user/{GitHubアカウント名}` ブランチを作成
2. PR を送ると Heroku Review Apps が自動デプロイ → 採点 URL が生成

### 失格の多発
採用イベントでは**上位陣を中心にレギュレーション違反が多発** (機能落ち・デザイン差異)。自動検証 (VRT) が未実装だったことが原因。**VRT は 2021 年以降に導入されたと思われる**。

### 仕込まれた問題 (出題のねらいと解説より)

**ビルド設定層**
| 問題 | 詳細 |
|------|------|
| `NODE_ENV=development` | React のプロダクション最適化が無効 |
| `webpack mode: 'none'` | 自動最適化が完全に無効 |
| `inline-source-map` | バンドルに source map が埋め込まれ肥大化 |
| `@babel/plugin-transform-modules-commonjs` | Tree shaking が機能しない |
| babel-loader が `node_modules` を除外しない | 全パッケージが再トランスパイル |
| PostCSS の `preserve: false` 未設定 | カスタムプロパティが二重出力 |

**フロントエンド層**
| 問題 | 詳細 |
|------|------|
| `<script>` に `defer` なし | レンダーブロッキング |
| Web フォントの全ウェイト読み込み | 不要な 400/500/600 weight を全読込 |
| 未使用 CSS | utility library 全体を読み込み |
| `jQuery` (30.4KB) | DOM 操作のみ |
| `ImmutableJS` (17.2KB) | `toJS()` で即座に変換するだけ |
| `lodash` (24.3KB) | Tree shaking 非対応、基本操作のみ |
| `moment-timezone` (94.9KB) | timezone 機能は未使用 |
| `bluebird` (21.7KB) | 依存チェーンに隠れている |
| `axios` (4.4KB) | fetch で代替可能 |
| `react-helmet` (5.9KB) | title タグ設定だけ |
| 画像を url-loader で Base64 化 | 圧縮なし、巨大解像度のまま |
| API 呼び出しがシーケンシャル | 並列化されていない |
| `moment(date)` を繰り返し呼び出す | 無駄な計算 |

**バックエンド層**
| 問題 | 詳細 |
|------|------|
| `babel-node` をプロダクションで使用 | メモリオーバーヘッド大 |
| ランダムに時間変動する無意味な計算 | 意図的遅延 |
| gzip/Brotli なし | 圧縮未実装 |
| HTTP/1.1 | HTTP/2 未使用 |
| SSR なし | First Paint が遅い |

### 最高スコア
- 学生部門: **550.81 点** (上限 575 点)

### 2020 公式解説で示された修正コード例

```bash
# NODE_ENV
- "build:webpack": "cross-env NODE_ENV=development webpack"
+ "build:webpack": "cross-env NODE_ENV=production webpack"
```

```js
// webpack mode & devtool
- mode: 'none',
- devtool: 'inline-source-map',
+ mode: 'production',
+ devtool: false,

// babel-loader: node_modules を除外
{
  test: /\.m?jsx?$/,
+ exclude: /node_modules/,
  use: { loader: 'babel-loader' }
}

// url-loader → file-loader に変更 (画像が Base64 化されてサイズが 1.3 倍になるのを防ぐ)
```

```json
// babel: CommonJS 変換を削除 (Tree Shaking を有効化)
{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
- "plugins": ["@babel/plugin-transform-modules-commonjs"]
}
```

```js
// PostCSS: source map 無効化 + custom properties の preserve を false に
- customProperties()
+ customProperties({ preserve: false })   // 変換前後の両方が出力されるのを防ぐ

// postcss-calc: calc() を静的計算
// cssnano: CSS minify
```

```html
<!-- script に defer を追加 (レンダーブロッキング解消) -->
- <script src="main.bundle.js"></script>
+ <script src="main.bundle.js" defer></script>

<!-- Google Fonts: 必要なウェイト・文字のみ -->
- @import 'https://fonts.googleapis.com/css?family=Baloo+Thambi+2:400,500,600,700,800&display=swap';
+ @import 'https://fonts.googleapis.com/css?family=Baloo+Thambi+2:700&display=swap&text=Amida%20Blog:';

<!-- WebP フォールバック -->
<picture>
  <source type="image/webp" srcset="foo.webp">
  <source type="image/jpeg" srcset="foo.jpg">
  <img src="foo.jpg" alt="">
</picture>
```

```js
// API 呼び出しを並列化
- await fetchBlog(...);
- await fetchEntry(...);
- await fetchCommentList(...);
+ await Promise.all([fetchBlog(...), fetchEntry(...), fetchCommentList(...)]);

// lodash.chunk + flexbox → CSS Grid に置き換え
- const rows = _.chunk(list, columnCount);  // lodash 不要
+ // CSS Grid で実装 (grid-template-columns: repeat(4, 1fr))

// react-helmet → useEffect に
- <Helmet><title>{title}</title></Helmet>
+ React.useEffect(() => { document.title = title; }, [title]);

// bluebird の削除: race-timeout が native-or-bluebird 経由で引き込んでいる
// Promise.race() + setTimeout() で自前実装して bluebird を削除
```

```js
// 意図的な遅延処理 (バックエンド)
// createId() という関数が n*1000 回のループを実行してからソートする
// → クライアントで使われていない → 完全に削除
function createId(n) {
  const c = [];
  const len = n * 1000;   // 意図的に重い
  for (let i = 0; i < len; i++) { c.push[i]; }
  return c.sort((a, b) => a - b).join(',');
}
```

### ライブラリ代替 (2020 年公式解説より)

| 削除するライブラリ | サイズ | 代替 |
|-------------------|--------|------|
| jQuery | 30.4KB | DOM API (`document.getElementById` 等) |
| ImmutableJS | 17.2KB | spread syntax でイミュータブル更新 |
| lodash | 24.3KB | `lodash-es` (named import) / `babel-plugin-lodash` / ネイティブ |
| moment-timezone | 94.9KB | 素の `moment` (20.4KB) / `day.js` (2.8KB) |
| bluebird | 21.7KB | `Promise.race() + setTimeout()` |
| Axios | 4.4KB | `fetch()` / `redaxios` (884B) |
| react-helmet | 5.9KB | `React.useEffect(() => { document.title = ... })` |
| React DOM | 35.9KB | Preact (3.8KB) ※ほぼ同一 API |

### リソースヒントの種類 (2020 年公式解説より)

| 種類 | 効果 |
|------|------|
| `dns-prefetch` | DNS ルックアップを事前実行 |
| `preconnect` | DNS + TCP + TLS ネゴシエーションを事前実行 |
| `preload` | 現在ページのリソースを優先読み込み |
| `prefetch` | 次ページのリソースを低優先度で事前取得 |
| `prerender` | 次ページ全体を事前レンダリング |

dns-prefetch と preconnect は**併用推奨**:
```html
<link rel="preconnect" href="https://example.com">
<link rel="dns-prefetch" href="https://example.com">
```

---

## 2021 mini — CAwitter

### アプリ概要
- **テーマ**: 短文投稿 SNS (画像・動画・音楽投稿機能付き)
- **名前**: CAwitter
- **技術スタック**: CSS (80.6%) / JavaScript (19.3%) / HTML
- **デプロイ**: 自由 (Heroku 推奨)

### 開催形式
- **期間**: 2021 年 12 月 4 日〜2022 年 1 月 3 日 (約 1 ヶ月)
- **参加方法**: GitHub Issues から登録、自動計測

### スコア計算式
```
Lighthouse × 複数ページ
満点: 720 点
初期スコア: 3〜5 点
```

### 作問意図 (作問者 3846masa)
1. 前回の解説で基本ノウハウが公開済みのため新しい課題を設計
2. **メディア処理と高速化の両立** という実務課題を体験させる
3. 音声波形抽出・メタデータ表示など実践的機能を含む
4. プロダクト品質の UI で競技をゲーム化

### 仕込まれた問題
- メディア処理 (動画・音声・Web フォント最適化を避けたくなる設計)
- 複雑なコード構造
- 多機能アプリ (音声波形をクライアント側でデコード)

### 解法のポイント (traP ほぼ満点 + nissy scraps より)

| 最適化 | スコア改善 |
|--------|-----------|
| passive event listener 修正 | +50 点 |
| 音声波形データをサーバー側で生成 | +140 点 |
| `font-display: swap` | +150 点 |
| WebP / WebM 変換 | — |
| lodash / moment / jQuery 削除 | — |
| Azure VM + Cloudflare | — |

### 過去の 2021 年前半イベント (2 月・5 月) の実績
- 学生参加者が **600 点以上 / 720 点** を達成し、作問者の想定を超えた
- 大半の参加者は 200 点台、一部の社員が 500 点以上

### 最高スコア
- **719.91 / 720 点** (traP、ほぼ満点)

### ほぼ満点の戦略詳細 (sappi_red)

- **バンドル削減**: 12,222 kB → 80.3 kB (152 倍縮小) ← React → Preact 置換、lodash/jQuery/moment 削除、pako 削除
- **CSS 削減**: 6,341 kB → 159 kB ← Tailwind CSS purging + `css-minimizer-webpack-plugin`
- **動画削減**: 183,698 kB → 5,141 kB ← GIF → WebM VP9 → WebM AV1
- **画像削減**: 91,099 kB → 276 kB ← JPEG → WebP → AVIF (quality 40, 半サイズモバイル版も生成)
- **フォント CSS** を `requestIdleCallback` で遅延読み込み
- **Azure VM (East US)** を採用 → GitHub Actions のベンチマーク環境 (East US) に地理的に近接して RTT を最小化
- **Caddy** リバースプロキシで HTTP/2 サーバープッシュを利用
- API の初期取得数を 10 → 3 に削減 (パース負荷軽減)

### 作問時の苦労
- 「普通に実装するとじゅうぶんに遅くできない」という問題があった
- メディア (動画・音声・フォント) を「放棄せず最適化する」というテーマを意図的に選択

---

## 2022 年 (学生部門) — CyberTicket (Student)

### 開催形式
- **期間**: 2022 年 3 月 5〜6 日 (2 日間)
- **対象**: 学生限定
- **参加者**: 約 40 名
- **結果**: traP (東工大デジタル創作部) メンバーが 2 位・3 位

---

## 2022 年 (公開) — CyberTicket

### アプリ概要
- **テーマ**: 架空のベッティングサービス (じゃんけんトーナメントへの投票)
- **名前**: CyberTicket
- **技術スタック**: JavaScript (98.8%), Webpack, Yarn, React
- **デプロイ**: Heroku (推奨)

### 開催形式
- **期間**: 2022 年 11 月 1〜27 日 (約 1 ヶ月)
- **参加**: 誰でも参加可能、GitHub アカウント必要

### スコア計算式
```
FCP×10 + SI×10 + LCP×25 + TTI×10 + TBT×30 + CLS×15
= 最大 100 点 × 5 ページ = 500 点満点
```

**メトリクスの配点 (重要度順)**
1. TBT: ×30 (最大)
2. LCP: ×25
3. CLS: ×15
4. FCP: ×10
5. SI: ×10
6. TTI: ×10

### 初期スコア
- Lighthouse で **6 点** (5 ページ合計)

### 計測対象ページ (5 ページ)
1. トップページ (注意: `/` ではなく `/:date` が計測対象！)
2. エントリー表
3. オッズページ (2 種)
4. 結果ページ

### 最高スコア
- **500 点 満点** (Naotoshi Fujita, yusukebe の 2 名が達成)
- 499.1 点 (加藤 零, Heroku 単体)

### 賞品・注意事項
- **賞品なし**: 学生部門・社内イベントが既に終了しているため
- 参加登録時に GitHub アカウント名が**一般公開**される
- `#WebSpeedHackathon` ハッシュタグで成果をツイート推奨
- 長期開催のため計測トラブル対応はベストエフォート

### Heroku の制限
Heroku の無料プランは HTTP/2 非対応のため、CDN なしでの満点達成が困難。Cloudflare または Linode/VPS への移行が必要。
なお、この大会は Heroku 無料プランの廃止直前に開催された最後の機会でもあった。

### 2022 年に仕込まれていた罠 (加藤 零 氏の解説より)

| 罠 | 詳細 | 対処法 |
|----|------|--------|
| `setInterval` に 0ms | レース開催時刻の更新が毎フレーム実行 | 1000ms に修正 |
| canvas で画像描画 (TrimmedImage) | canvas の計算が TBT を悪化させる | CSS `object-fit` / `object-position` に置換 |
| 全レース一覧を全件取得 | ページに不要なデータを取得 | URL クエリで当日分のみに絞る |
| `disableCSSOMInjection` (styled-components) | CSS-in-JS の注入を無効化してスタイルが遅延 | オプションを削除 |
| `react-router` 全体バンドル | ルーティングライブラリが重い | `wouter` (ゼロ依存) に置換 |

### 2022 年のアドバンスドテクニック (上位陣の戦略)

```tsx
// @loadable/component でルートを SSR 対応のままコード分割
import loadable from "@loadable/component";
const LoadableTop = loadable(() => import("./pages/Top"), {
  fallback: undefined,
  ssr: true,
});
```

- **React → Preact 置換**: `alias: { react: 'preact/compat', ... }` でバンドル削減
- **SSR + Hydration**: styled-components + @loadable/component で実装
- **データ prefetch**: レース詳細情報を SSR の HTML に注入して API リクエスト削減
- **フォントサブセット化**: 数字とカンマのみ使用するフォントは `subset-font` で最小化

---

## 2023 年 — 買えるオーガニック

### アプリ概要
- **テーマ**: 架空のショッピングサイト
- **名前**: 買えるオーガニック (Kaeruorganic)
- **技術スタック**: TypeScript (97.7%), pnpm, Vite, React, GraphQL
- **デプロイ**: Fly.io (Docker 対応)

### スコア計算式
- Lighthouse ベース (詳細は非公開だが Lighthouse の Performance score)

### 主な仕込まれた問題 (参加記より推測)
- GraphQL の N+1 問題 → DataLoader で解決
- 同期 XHR → 廃止でスコア 2 倍 (monica 氏)
- `useSuspenseQuery` の使用 → `useQuery` に変えると FCP 大改善
- `zipcode-ja` (郵便番号 DB 全体) → 外部 API に置換
- Noto Serif JP (12MB) → サブセット化で 9KB
- ReDoS 正規表現 (ログイン・バリデーション)
- 画像未最適化 (PNG/JPEG → WebP/AVIF)

### 最高スコア
- 347 点 (monica 氏、規約違反で無効)

---

## 2024 年 — Cyber TOON

### アプリ概要
- **テーマ**: 架空の漫画サイト
- **名前**: Cyber TOON
- **技術スタック**: TypeScript (100%), pnpm, Docker
- **デプロイ**: 自由

### 開催形式
- **期間**: 2024 年 3 月 23〜24 日 (2 日間)
- **参加**: 誰でも参加可能

### スコア計算式
```
ページランディング (4 ページ × 100 点 = 400 点):
  FCP×10 + SI×10 + LCP×25 + TBT×30 + CLS×25

ユーザーフロー (6 フロー × 50 点 = 300 点):
  TBT×25 + INP×25

合計: 700 点満点
```

### 計測対象ページ (4 ページ)
1. ホーム
2. 作者詳細
3. 作品詳細
4. エピソード詳細 (漫画ビューア)

### 初期スコア
- Lighthouse が正しく評価できないほど重い (27.75 / 700 点)
- 初回リクエスト: **651 件**、**100MB** 通信、**1.1 分** の通信時間

### 主な仕込まれた問題 (参加記より)
- Three.js で HeroImage を描画 (→ `<img>` タグに置換)
- Service Worker の Jitter + 並列リクエスト制限 (5 件)
- 漫画ビューアに 4096 回のループ (「世界の変化追従」という名前のループ処理)
- 全レスポンスに `no-store` + zstd ランタイム圧縮 → 0.1 vCPU / 512MB 環境でボトルネック化
- 500ms 以上の jitter (意図的な遅延) → 削除で改善
- リアルタイム画像リサイズ → 事前 WebP マルチサイズ生成に変更
- `unicode-collation-algorithm2` (1MB) → `Intl.Collator`
- `magika` (2.2MB) → 削除
- ReDoS 正規表現 (ログイン・バリデーション)
- jquery・lodash・moment-timezone → 削除
- 未使用フォント (Noto Sans JP)
- HeroImage に base64 PNG が直接埋め込まれていた

### 2024 年に効いた施策 (cp20 優勝者の詳細)

| 施策 | 効果 |
|------|------|
| ReDoS 修正 (ログイン) | ログインスコアがほぼ満点に |
| `@mui/icons-material` → tree-shaking | バンドル削減 |
| JXL 形式廃止 → AVIF 変換 (`sharp`) | 画像変換エラー解消 |
| srcSet でデバイス幅別配信 | LCP 改善 |
| 検索結果のデバウンス (500ms) | INP 改善 |
| 利用規約を遅延読み込み (最終手) | スコア押し上げ |
| SSR + データ事前取得 | CLS 大幅削減 |

> [!WARNING]
>
> JXL 形式は ImageMagick での AVIF 変換に失敗する場合がある → `sharp` npm パッケージを使う

> [!WARNING]
>
> 初回デプロイに注意: Docker Build などで 45 分かかる場合あり。序盤の時間管理に注意。

### 作品情報編集・管理画面
- 上位 2 名とも 0.75 / 50 点以下 (共通の難所、手が回らない)

### 最高スコア
- **542.85 / 700 点** (優勝者、暫定 5 位から繰り上がり)
- 上位勢の多くが E2E テスト不合格で脱落

---

## 2025 年 — AREMA

### アプリ概要
- **テーマ**: 架空の動画配信サービス
- **名前**: AREMA
- **技術スタック**: TypeScript (96.6%), JavaScript (3.4%), pnpm
- **デプロイ**: 自由 (Cloudflare 推奨)

### 開催形式
- **期間**: 2025 年 3 月 22〜23 日 (10:30〜17:30 JST、実質 2 日間)
- **参加**: connpass で応募

### スコア計算式 (1200 点満点)

```
① ページ表示 (900 点 = 9 ページ × 100 点)
   FCP×10 + SI×10 + LCP×25 + TBT×30 + CLS×25

② ユーザーインタラクション (200 点 = 4 シナリオ × 50 点)
   TBT×25 + INP×25

③ 動画再生 (100 点 = 2 シナリオ × 50 点)
   t_mod = max(0, t - 800)
   score_vanilla = 1 - (t_mod / (t_mod + 3000))
   score = score_vanilla × 50
   ※ t: ページロードから playing イベントまでの時間 (ms)
   ※ t ≥ 20,000ms で 0 点
```

**重要な条件**: ページ表示スコアが **200 点以上** でないと、②と③の計測が行われず 0 点になる。

### 計測対象ページ (9 ページ)
1. ホーム
2. 番組表
3. 番組 (放送前)
4. 番組 (放送中)
5. 番組 (放送後)
6. シリーズ
7. エピソード (無料)
8. エピソード (プレミアム)
9. 404 エラーページ

### ユーザーインタラクション (4 シナリオ)
1. 認証フロー
2. 番組表のカラムリサイズ
3. ナビゲーション操作 1
4. ナビゲーション操作 2

### レギュレーション要点
- Chrome 最新版で著しい機能落ち・デザイン差異を発生させてはならない
- VRT 失敗は失格
- `test_cases.md` に記載の手動テスト項目の失敗は失格
- VRT・テストを意図的に回避するコードは禁止
- `POST /api/initialize` でデータベースが初期値にリセットできること (採点サーバーが前提とする)
- 競技終了後に採点 URL へのアクセスを維持すること
- 外部 SaaS は無料枠のみ (有料は自己負担)

### 初期スコア
- **67 点** (全体の 5.6%)

### 主な仕込まれた問題
- `webpack mode: 'development'`, inline source map
- `LimitChunkCountPlugin(maxChunks: 1)` でチャンク分割を無効化 → `maxChunks: 9999` に変更
- FFmpeg WASM (30〜40MB) → サーバー事前生成に変更
- `p-min-delay` で API に 1000ms 意図的遅延
- `useSubscribePointer` でグローバルマウス位置を毎フレーム更新
- `Hoverable` コンポーネントがグローバルストアを購読
- UnoCSS がランタイム動作 (バンドルに UnoCSS エンジンが含まれる)
- SVG ロゴに base64 フォント埋め込み (5MB+)
- m3u8 プレイリストの X-AREMA-INTERNAL に `randomBytes(3MB)` の padding
- `no-store` が全 HTTP レスポンスにデフォルト設定
- 動画プレイヤーが Shaka / hls.js / Video.js の 3 種類すべてバンドル
- hls.js の WebWorker が意図的に無効化されている
- **バリデーションライブラリが 3 種類 (Zod + TypeBox + ValiBot) 共存** → 1 つに統一
- 250ms 定期実行ポーリング → `ResizeObserver` + `scroll-snap` CSS で代替
- API レスポンスに不要フィールドが大量含まれる → Zod `.strip()` or DB クエリ制限で削減
- レコメンド情報が再帰展開形式 → `id → data` マップ形式に変更で **60MB → 400KB** (nahco3)
- GIF ファイル (60MB) → WebM 変換で大幅削減

### 最高スコア
- **477.16 / 1200 点** (shun_shobon、学生 1 位・全体 4 位)
- バンドルサイズ: 161MB → 964KB (約 164 倍の削減)
- 上位 20 名中 19 名がレギュレーション違反で失格

### 2025 優勝者 (shun_shobon) の作業詳細

**初期状態の数値**
- HTML: 57MB、main.js: 161MB、API リクエスト: 57MB
- ほぼ全コンポーネントが常時再レンダリング

**効果が大きかった施策**
1. FFmpeg WASM 除去 → シークバーサムネをローカルで事前生成
2. UnoCSS ランタイム廃止 → ビルド時 CSS 生成に移行
3. Webpack → Vite 移行 (babel-loader の遅さ解消)
4. API レスポンス削減: `description` フィールド削除、`limit` 追加で不要データをカット
5. `useSubscribePointer` 削除 (グローバルマウス位置追跡廃止)
6. Zustand セレクタ修正: 全値購読 → 必要な値だけ購読
7. Cloudflare CDN (HTTP/2 + zstd 圧縮)

**やり残して後悔した施策**
- DB インデックス追加 (大会後に試したら 10 倍高速化)
  - `recommendedModules` エンドポイント: `order` と `referenceId` にインデックス + `episodes` に `limit: 1` → 3.5s → 400ms
  - 別参加者 (mizchi) の計測では: DB インデックスで LCP 3500ms → 1300ms に改善
- hls.js の WebWorker 有効化
- カルーセルサイズ計算の `window.getComputedStyle()` が Long Task 化 → `requestIdleCallback` で分離できた

**SSR について**: 実装したが、スコア改善効果は限定的だった。

**静的ファイルのキャッシュ設定**: `max-age=30` で自動更新させつつ適度なキャッシュを設定。

---

## 年度比較表

| 年度 | テーマ | 技術 | 満点 | 初期点 | バンドル初期 |
|------|--------|------|------|--------|-------------|
| 2020 | ブログ | JS/CSS/Webpack | ~575 | 0 | 15.6MB |
| 2021 mini | SNS | JS/CSS | 720 | 3〜5 | 12.2MB |
| 2022 | ベッティング | JS/Webpack | 500 | 6 | — |
| 2023 | ショッピング | TS/Vite/pnpm | 不明 | — | — |
| 2024 | 漫画 | TS/pnpm | 700 | 27.75 | 119.89MB |
| 2025 | 動画配信 | TS/pnpm | 1200 | 67 | 161MB |

## 共通パターン (全年度)

毎年必ず仕込まれる罠:
1. **webpack/Vite が development mode**
2. **source map がインライン埋め込み**
3. **NODE_ENV が development**
4. **重いライブラリ** (moment/lodash/jQuery...)
5. **画像・フォントが未最適化**
6. **ReDoS 脆弱性のある正規表現**
7. **意図的な遅延処理**
8. **DB インデックスなし / N+1 クエリ**
9. **gzip/Brotli 圧縮なし**
10. **SSR なし**
