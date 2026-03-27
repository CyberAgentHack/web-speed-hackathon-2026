# WSH 実践チェックリスト

競技中にこのリストを上から順に実行する。効果の大きいものから並べてある。

---

## Phase 0: 準備 (競技開始直後、30 分以内)

- [ ] **レギュレーション (`docs/regulation.md`) を熟読する (最初に！)**
- [ ] **`docs/scoring.md` で採点ページ・計算式を確認する**
- [ ] **`test_cases.md` でテスト項目を確認する**
- [ ] アプリを全ページ手動で触ってみる
- [ ] 初期スコアを計測・記録する
- [ ] `webpack-bundle-analyzer` または `rollup-plugin-visualizer` を導入してバンドルを可視化
- [ ] Network タブで重いリクエストを確認 (上位 5 件をメモ)
- [ ] Lighthouse で各メトリクスを確認 (どこが低いか把握)
- [ ] VRT の動かし方を確認しておく (失格しないために必須)
- [ ] `p-min-delay` / `pMinDelay` / `delay` / `sleep` を grep で検索する
- [ ] ReDoS 脆弱性のある正規表現を grep で検索する (ログイン・バリデーションに毎年仕込まれる)
- [ ] `POST /api/initialize` が正常に動くか確認する (採点前に DB リセットされる)

> [!WARNING]
>
> **初手は Lighthouse が使えない**
>
> 初期状態ではページ表示に 5 分以上かかる場合があり、Lighthouse は**真っ白な画面を完成状態として誤認**する (TBT 0ms などの虚偽スコアが出る)。この段階の Lighthouse スコアは全く信頼できない。

**初手で使える計測手法 (Lighthouse の代わり)**:

```ts
// コードの任意の箇所に挿入して処理時間を計測
console.time('fetchUserData');
const data = await fetchUserData();
console.timeEnd('fetchUserData');  // → "fetchUserData: 4823.4 ms"
```

```ts
// DevTools の Performance タブのタイムラインにも表示される
performance.mark('render-start');
renderApp();
performance.mark('render-end');
performance.measure('render', 'render-start', 'render-end');
```

1. **Network タブ**で最も重いリクエストを目視確認する (Size でソート)
2. **console.time()** を怪しい箇所 (API 呼び出し・ライブラリ初期化・レンダリング) に挿入して計測
3. 「明らかに重いもの (FFmpeg WASM・p-min-delay・ライブラリ巨大 import)」を除去する
4. ページが数秒以内に表示されるようになってから、初めて Lighthouse を回す
- [ ] 採点サーバーのリージョンを確認する → **Azure East US 付近が多い**。デプロイ先を近いリージョンにすると RTT が最小化される

---

## Phase 1: ビルド設定の修正 (効果: スコア 2〜5 倍)

### webpack の場合

```js
// webpack.config.js
module.exports = {
  mode: 'production',           // ← development → production
  devtool: false,               // ← source-map を削除
  // ...
}
```

### Vite の場合

```js
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: false,
    minify: 'terser',
  }
})
```

### 環境変数

```bash
NODE_ENV=production  # ← 設定されているか確認
```

### Babel / SWC のターゲット設定

```json
// .browserslistrc or package.json
"browserslist": "last 2 Chrome versions"
// または
"targets": "> 0.5%, last 2 versions, not dead"
```

- [ ] `mode: 'production'` に設定
- [ ] source map を削除または外部化
- [ ] `NODE_ENV=production` を確認
- [ ] browserslist を最新 Chrome に絞る (polyfill 大幅削減)
- [ ] `polyfills.ts` 等の polyfill ファイルを**完全削除** (Chrome 最新版対応なら不要)
- [ ] `LimitChunkCountPlugin` があれば削除 (チャンク分割を妨げる)
- [ ] inline source map があれば削除
- [ ] Dockerfile がある場合、マルチステージビルドに最適化する

```dockerfile
# Dockerfile: マルチステージビルドの例
FROM node:20-slim AS builder
RUN npm i -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm install --prod --frozen-lockfile
CMD ["node", "dist/index.js"]
```

### Vite / Rspack への移行 (AI に任せて試みる価値あり)

webpack 以外のバンドラーでも、Vite への移行はチャンク分割・動的 import が格段に楽になるため効果が大きい。Claude Code 等の AI に任せれば機械的に移行できる場合が多い。**ダメだったら即 revert** という前提で試みる。

> [!IMPORTANT]
>
> タイムボックス: 1 時間。超えたら revert して次の Phase へ進む。

```
優先順位: Vite > Rspack (webpack 互換で設定変更が最小) > webpack そのまま

注意: WASM や特殊な webpack loader が絡む場合は互換性問題が出やすい。
      Vite で詰まったら Rspack を試す。
```

- [ ] バンドラーが webpack/Rspack 以外なら Vite への移行を AI に依頼する
- [ ] 移行後は必ず `pnpm build` が通ることを確認
- [ ] 移行後は VRT を実行して差分がないか確認
- [ ] 1 時間以内に解決しなければ `git revert` して次へ

---

## Phase 2: バンドルサイズ削減 (効果: スコア 3〜10 倍)

### 削除すべきライブラリ (毎年仕込まれる)

| ライブラリ | サイズ | 代替手段 |
|----------|--------|---------|
| `moment` / `moment-timezone` | ~300KB | `day.js` または `date-fns` |
| `lodash` (全体 import) | ~70KB | ネイティブ JS または `lodash-es` の named import |
| `jQuery` | ~87KB | `document.querySelector` / `DOMContentLoaded` |
| `axios` | ~13KB | `fetch` |
| `react-router` の代わりに `<a>` | 0KB | `<Link>` で SPA 遷移化 |
| `framer-motion` | ~100KB | CSS animation |
| `core-js` 全体 | ~50KB+ | browserslist で自動削減 |
| `FFmpeg WASM` | ~30MB | サーバーで事前生成 |
| `unicode-collation-algorithm2` | ~1MB | `Intl.Collator` |
| `zod` (代替で軽量化) | ~50KB | `valibot` |
| `luxon` | ~70KB | `day.js` |

### 動的 import でバンドル分割

```tsx
// 重いコンポーネントを遅延読み込みに
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
const VideoPlayer = React.lazy(() => import('./VideoPlayer'));
```

### UnoCSS のランタイム → 静的ビルド移行

```bash
# ランタイム (NG): バンドルに UnoCSS エンジンが含まれる
# 静的ビルド (OK): ビルド時に CSS を生成

# package.json scripts
"build:css": "unocss --out-file src/generated.css"
```

```ts
// uno.config.ts: filesystem パターンを指定して静的抽出を確実に行う
export default defineConfig({
  content: {
    filesystem: ['src/**/*.{ts,tsx,html}'],
  },
})
```

```css
/* main.css の先頭に preflights を含めてCLS を抑制 */
@unocss preflights;
@unocss default;
```

```html
<!-- HTML の <head>: CSS を JS より先に読み込む -->
<link rel="stylesheet" href="/main.css" />
<script src="/main.js" defer></script>
```

> [!WARNING]
>
> 動的クラス名 (テンプレートリテラル) は静的抽出されない。`style` props または `safelist` で対応。

- [ ] bundle analyzer でサイズ順に上位ライブラリを確認
- [ ] `moment` → `day.js` に置換
- [ ] `lodash` を named import または削除
- [ ] `jQuery` を削除 (`DOMContentLoaded` に置換)
- [ ] `axios` → `fetch` に置換 (エラーハンドリングの挙動差異に注意)
- [ ] `FFmpeg WASM` を削除してサーバー事前生成に変更
- [ ] UnoCSS をランタイムから静的ビルドに変更
- [ ] 動的 import で重いチャンクを分割
- [ ] `LimitChunkCountPlugin` を削除
- [ ] CSS の `@import` を避ける (ウォーターフォール読み込みが発生する → Sass/PostCSS の import に変換)
- [ ] Tailwind CSS / UnoCSS の purge (未使用クラス削除) が有効になっているか確認 (動的クラス名は safelist に追加)
- [ ] 動画プレイヤー (Shaka/hls.js/Video.js) が全部バンドルされていないか確認 → 動的 import で分離
- [ ] hls.js の WebWorker が無効化されていないか確認 → 有効化する
- [ ] React → Preact alias でバンドル削減を検討

```ts
// vite.config.ts (Preact alias)
resolve: {
  alias: {
    'react': 'preact/compat',
    'react-dom': 'preact/compat',
  },
}
```

---

## Phase 3: 意図的な遅延の除去 (効果: スコア 1.5〜2 倍)

毎年必ず仕込まれている。コード全体を検索して探す。

```bash
# 検索コマンド
grep -r "p-min-delay\|pMinDelay\|delay\|sleep\|setTimeout\|setInterval" src/
grep -r "Math.random\|faker\|Math.floor.*1000" src/
```

### 典型的な仕込みパターン

```tsx
// NG: わざと遅らせている
import pMinDelay from 'p-min-delay';
const data = await pMinDelay(fetchData(), 1000);

// OK: 削除
const data = await fetchData();
```

```tsx
// NG: グローバルマウス位置追跡 (毎フレーム再レンダリング)
const useGlobalPointer = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    window.addEventListener('pointermove', (e) => setPos({ x: e.x, y: e.y }));
  }, []);
};

// OK: 削除して CSS :hover に置き換え
```

```tsx
// NG: Hoverable コンポーネントがグローバル状態に依存
<Hoverable>...</Hoverable>

// OK: CSS で実装
.item:hover { ... }
```

- [ ] `p-min-delay` を削除
- [ ] グローバルマウス位置追跡を削除
- [ ] `Hoverable` コンポーネントを CSS `:hover` に置換
- [ ] `useSubscribePointer` 等のグローバルポインター購読を削除
- [ ] `setInterval` の必要以上に短い間隔を確認
- [ ] `react-router` の intentional delay を削除
- [ ] `Prioritized Task Scheduling API` の遅延を削除

---

## Phase 4: アセット最適化 (効果: スコア 1.5〜3 倍)

### 画像

```bash
# AVIF 変換 (最も圧縮率が高い)
find ./public/images -name "*.jpg" -o -name "*.png" | xargs -I{} sh -c '
  convert "{}" -quality 60 "${{}%.*}.avif"
'

# ImageMagick で一括変換
magick mogrify -format avif -quality 60 public/images/*.jpg

# sharp (Node.js)
const sharp = require('sharp');
await sharp('input.jpg').avif({ quality: 60 }).toFile('output.avif');
```

```html
<!-- lazy loading (LCP 要素以外) -->
<img src="photo.avif" loading="lazy" width="800" height="600" />

<!-- LCP 要素は eager (デフォルトなので属性不要でもよい) -->
<img src="hero.avif" fetchpriority="high" width="1200" height="600" />

<!-- <picture> で画面サイズ・解像度別に切り替え -->
<picture>
  <source media="(max-width: 768px)" srcset="hero-sp.avif" />
  <source media="(min-width: 769px)" srcset="hero-pc.avif" />
  <img src="hero-pc.avif" fetchpriority="high" width="1200" height="600" />
</picture>
```

### フォント

```bash
# サブセット化
npx subset-font --subset="あいうえお..." input.woff2 -o output.woff2

# WOFF2 変換
woff2_compress input.ttf
```

```css
@font-face {
  font-family: 'MyFont';
  font-display: swap; /* ← テキストを先に表示 */
  src: url('font.woff2') format('woff2');
}
```

### 動画・音声

```bash
# WebM/AV1 変換
ffmpeg -i input.mp4 -c:v libaom-av1 -crf 30 output.webm

# 音声 → Opus 変換 (mp3/aac より大幅に軽い)
ffmpeg -i input.mp3 -c:a libopus -b:a 64k output.webm

# サムネイル事前生成 (FFmpeg WASM を削除するために)
ffmpeg -i input.mp4 -ss 00:00:01 -vframes 1 thumbnail.avif

# HLS セグメント生成 (長い動画のストリーミング向け)
ffmpeg -i input.mp4 -c:v h264 -hls_time 6 -hls_playlist_type vod output.m3u8
```

- [ ] すべての画像を WebP または AVIF に変換
- [ ] 画像を適切なサイズにリサイズ (表示サイズの 2x 程度)
- [ ] LCP 以外の画像に `loading="lazy"` を追加
- [ ] 画像に `width`/`height` 属性を指定 (CLS 対策)
- [ ] `<picture>` + srcSet でレスポンシブ画像を設定 (特にヒーロー画像)
- [ ] フォントをサブセット化
- [ ] フォントを WOFF2 形式に変換
- [ ] `font-display: swap` を設定
- [ ] SVG に base64 フォントが埋め込まれていれば PNG に変換
- [ ] GIF → WebM/MP4 に変換
- [ ] 音声ファイルを Opus (.webm) に変換
- [ ] 長い動画は HLS または MPEG-DASH でストリーミングする (一括ダウンロードを避ける)
- [ ] FFmpeg WASM を削除してサーバー事前生成に変更

---

## Phase 5: バックエンド・ネットワーク最適化 (効果: スコア 1.5〜2 倍)

### DB インデックス

毎年仕込まれている。スロークエリがあれば必ず疑う。

```sql
-- Drizzle ORM でインデックス追加
CREATE INDEX idx_recommended_order ON recommended_module(order, referenceId);

-- SQLite
CREATE INDEX IF NOT EXISTS idx_episode_seriesId ON episodes(seriesId);
```

### N+1 問題

```ts
// NG: ループ内で個別取得
for (const id of ids) {
  const item = await db.find(id);  // N 回クエリ
}

// OK: 一括取得
const items = await db.findMany({ where: { id: { in: ids } } });
```

### API レスポンス削減

```ts
// NG: 不要なフィールドを全部返す
return { id, title, description, content, author, tags, ... }

// OK: 必要最小限に絞る
return { id, title, author }

// limit を必ず設定
const items = await db.findMany({ take: 20 });
```

### 圧縮

```ts
// Fastify
import compress from '@fastify/compress';
app.register(compress, { global: true, encodings: ['gzip', 'br'] });
// ⚠️ リアルタイム Brotli はサーバー負荷が高い → Cloudflare に任せる方が安全
```

### キャッシュヘッダー

> **⚠️ WSH では HTTP キャッシュはスコアに効果なし**
> 採点ツールは Lighthouse を毎回 cold start (キャッシュなし) で実行するため、`Cache-Control` ヘッダーを設定してもスコアは改善しない。対応不要。

- [ ] DB インデックスを追加 (テーブルのリレーションを確認)
- [ ] N+1 クエリを一括クエリに変換
- [ ] API レスポンスの不要なフィールドを削除
- [ ] API に `limit` を設定
- [ ] **過剰な負荷対策コードを削除する** (WSH は並列アクセスなし → レート制限・キュー・スロットリングは全て不要)
- [ ] gzip 圧縮を有効化 (`@fastify/compress`)
- [ ] 不要な API 呼び出しを削除 (同データを複数回取得していないか)
- [ ] `no-store` がデフォルト設定されていれば削除
- [ ] `Promise.all` で独立した API 呼び出しを並列化 (2020 年でも仕込まれていた)
- [ ] m3u8 / HLS プレイリストに不要な padding (randomBytes 等) が含まれていないか確認 → サーバー側で除去
- [ ] API レスポンスが `{ id: ..., data: { [id]: ... } }` マップ形式で返せないか検討 (60MB → 400KB の事例あり)
- [ ] **Network throttling (Slow 4G または 3G) で手動確認する** → ローカル環境は速すぎて問題に気づけない

```
DevTools > Network > No throttling → Slow 4G に変更して全ページを確認
```

**Cache-Control の落とし穴 (nissy 氏の知見)**:
- `no-store`: キャッシュを完全に禁止 (最も強力)
- `no-cache`: キャッシュするが毎回再検証 (`no-store` とは別物！)
- `max-age=0`: キャッシュを無効化しない → 無効化には `must-revalidate` が必要
- `immutable`: リロード時に再検証しない (ハッシュ付きファイルに最適)
- `stale-while-revalidate`: 古いコンテンツを返しながらバックグラウンドで更新

---

## Phase 6: CDN / インフラ (効果: スコア 1.3〜1.5 倍)

- [ ] Cloudflare を導入 (HTTP/2・HTTP/3・Brotli・CDN)
  - Cloudflare ダッシュボード: Speed > Optimization > HTTP/3 ON
  - 0-RTT も有効化するとさらに高速化
- [ ] Cloudflare で HTML キャッシュを明示的に設定 (デフォルトは HTML キャッシュ OFF)
- [ ] 静的ファイルを CDN 経由で配信 (Cloudflare Pages が手軽)
- [ ] デプロイごとに Cloudflare キャッシュをパージ

**フロント / バックエンド分離構成 (2023 事例)**

```
Cloudflare Pages (フロント) ← brotli自動 + CDN
         ↓ fetch with credentials
Fly.io / Koyeb / Railway (バックエンド API)
```

クロスオリジン構成の場合は以下が必要:
```ts
// フロントの fetch
fetch('/api/...', { credentials: 'include' })

// バックエンドのレスポンスヘッダー
Set-Cookie: ...; SameSite=None; Secure
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: https://your-front.pages.dev
```

---

## Phase 7: React レンダリング最適化 (効果: スコア 1.2〜1.5 倍)

### SSR

```tsx
// renderToString (シンプル)
import { renderToString } from 'react-dom/server';
const html = renderToString(<App />);

// renderToPipeableStream (React 18 推奨)
import { renderToPipeableStream } from 'react-dom/server';
const { pipe } = renderToPipeableStream(<App />, {
  onShellReady() { pipe(res); }
});
```

### 再レンダリング抑制

```tsx
// React Scan を使って再レンダリングを可視化
import { scan } from 'react-scan';
scan({ enabled: true });

// Zustand のセレクタを修正
// NG: store 全体を購読
const store = useStore();

// OK: 必要なフィールドだけ購読
const count = useStore(state => state.count);
```

- [ ] SSR を実装して FCP/LCP を改善
- [ ] **ファーストビューのクリティカル CSS をインライン化** (`<style>` タグに埋め込んでレンダーブロッキングを排除)
- [ ] `<Suspense>` を**細かく**くくる (粒度が粗いと関係ない部分まで遅延する)

```tsx
// NG: ページ全体を 1 つの Suspense で包む → 全体が遅延
<Suspense fallback={<Spinner />}>
  <Header />
  <MainContent />  {/* ← これだけ遅い */}
  <Footer />
</Suspense>

// OK: 遅い部分だけを Suspense で包む
<Header />
<Suspense fallback={<ContentSkeleton />}>
  <MainContent />
</Suspense>
<Footer />
```

- [ ] `<img>` 以外のリソース (動画・重いコンポーネント) は `IntersectionObserver` で遅延読み込み

```tsx
// IntersectionObserver で画面外の要素を遅延読み込み
const ref = useRef(null);
const [visible, setVisible] = useState(false);
useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
  });
  if (ref.current) observer.observe(ref.current);
  return () => observer.disconnect();
}, []);
return <div ref={ref}>{visible && <HeavyComponent />}</div>;
```

- [ ] React Scan で再レンダリングの多い箇所を特定
- [ ] Zustand/Redux のセレクタを最適化
- [ ] `React.memo` / `useMemo` / `useCallback` を適切に使用
- [ ] `content-visibility: auto` をオフスクリーン要素に適用 (レンダリングをスキップ)
- [ ] passive event listener を設定 (`{ passive: true }`) でスクロール性能改善
- [ ] LCP 要素より上にある画像の `loading="lazy"` を外す (LCP スコアを守る)

---

## Phase 8: 最終確認 (絶対に省略しない)

> [!IMPORTANT]
>
> **競技終了 30 分前**には最適化をやめてここに専念する。

- [ ] VRT を実行して差分がゼロか確認 (差分があれば revert する)
- [ ] Chrome 最新版で全ページを手動確認
- [ ] PC / モバイル両方を確認
- [ ] ログイン・ログアウトを確認
- [ ] フォーム送信 (登録・更新) を確認
- [ ] 動画/画像がすべて表示されているか確認
- [ ] **スクロール位置が保存されているか確認** (2025 年で上位 14 名全員が失格したポイント)
- [ ] **アイコンがすべて表示されているか確認** (UnoCSS の動的クラス名漏れ)
- [ ] **日時表示が正しいか確認** (タイムゾーン二重変換でズレていないか)
- [ ] レギュレーションを再度読んで違反がないか確認
- [ ] スコアを複数回計測 (25〜100 点のブレは正常。平均・最高値で判断)
- [ ] デプロイ完了を確認

---

## CSS で実装すべきもの (JS/ライブラリから移行)

| JS による実装 | CSS による実装 |
|-------------|-------------|
| Canvas でアスペクト比を保持 | `aspect-ratio` |
| JS でトリム・クロップ | `object-fit: cover` + `object-position` |
| JS でホバー検知 | `:hover` 疑似クラス |
| JS でスクロールスナップ | `scroll-snap-type` |
| framer-motion アニメーション | `@keyframes` + `transition` |
| JS で要素幅を計算して inline style | `max-width` / `aspect-ratio` / CSS 変数 |
| `<Ellipsis>` コンポーネント | `-webkit-line-clamp` |
| `<AspectRatio>` コンポーネント | `aspect-ratio` |


> スコア改善量の実績一覧は [README.md](./README.md) を参照。
> 失格・罠パターン一覧は [traps.md](./traps.md) を参照。
