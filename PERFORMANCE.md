# パフォーマンス問題一覧

## 対応履歴

| # | 問題 | 対応日 | 効果 | コミット |
|---|------|--------|------|--------|
| 1 | Webpack最適化無効 | 2026-03-20 | main.js: 108MB→245KB+73MB(wasm込) / minify+splitChunks有効化 | perf: webpack最適化有効化 |
| 2 | jQuery async:false | 2026-03-20 | メインスレッドブロック解消 / fetch()へ置き換え・jQuery削除 | perf: jQuery→fetchへ置き換え |
| 3 | InfiniteScroll 26万配列 | 2026-03-20 | スクロールGC負荷解消 / IntersectionObserver化 | perf: IntersectionObserver化 |
| 4 | Post defaultScope 全関連ロード | 2026-03-20 | 不要時の関連ロード排除 / scope('withAll')化 | perf: Post/Commentのdefaultscope最適化 |
| 5 | Comment defaultScope 全ユーザーロード | 2026-03-20 | 同上 | 同上 |

---

## 🔴 CRITICAL

### 1. ✅ Webpack 最適化が全て無効 [対応済 2026-03-20]
**ファイル:** `application/client/webpack.config.js:130-137`

```javascript
optimization: {
  minimize: false,           // 無効
  splitChunks: false,        // コード分割なし
  concatenateModules: false, // 無効
  usedExports: false,        // Tree-shaking 無効
  providedExports: false,
  sideEffects: false,
}
```

**影響:** main.js が **108MB** のまま配信される。適切に最適化すれば 5〜10MB 程度になるはず。

---

### 2. ✅ jQuery AJAX が全て同期実行 [対応済 2026-03-20]
**ファイル:** `application/client/src/utils/fetchers.ts:5-57`

```javascript
$.ajax({
  async: false,  // JS イベントループを完全ブロック
  ...
})
```

全ての画像・動画・API リクエストがメインスレッドをブロックする。`fetch()` に置き換えるだけで解消。

---

### 3. ✅ InfiniteScroll が毎スクロールで 26 万要素の配列を生成 [対応済 2026-03-20]
**ファイル:** `application/client/src/components/foundation/InfiniteScroll.tsx:14-39`

```javascript
const hasReached = Array.from(Array(2 ** 18), () => {  // 262,144 回!
  return window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;
}).every(Boolean);
```

スクロール・wheel・resize・touchmove のたびに毎秒 10 回以上実行。GC 負荷・ガタつきの原因。`IntersectionObserver` で代替可能。

---

### 4. ✅ Post モデルの defaultScope が全リレーションを常にロード [対応済 2026-03-20]
**ファイル:** `application/server/src/models/Post.ts:45-66`

```javascript
defaultScope: {
  include: [
    { association: "user", include: [{ association: "profileImage" }] },
    { association: "images", through: { attributes: [] } },
    { association: "movie" },
    { association: "sound" },
  ],
}
```

`Post.findAll()` を呼ぶだけで user / profileImage / images / movie / sound が毎回 JOIN される。タイムライン 30 件で 30+ クエリ。

---

### 5. ✅ Comment モデルも同様に全ユーザー情報を常にロード [対応済 2026-03-20]
**ファイル:** `application/server/src/models/Comment.ts:43-54`

コメント 50 件 = user + profileImage が 50 件分自動ロード。

---

### 6. DirectMessageConversation が全メッセージ + 全ユーザー情報をロード
**ファイル:** `application/server/src/models/DirectMessageConversation.ts:49-59`

```javascript
defaultScope: {
  include: [
    { association: "initiator", include: [{ association: "profileImage" }] },
    { association: "member",    include: [{ association: "profileImage" }] },
    {
      association: "messages",
      include: [{ association: "sender", include: [{ association: "profileImage" }] }],
      // ← ページネーションなし: 全メッセージ取得
    },
  ],
}
```

会話数 × メッセージ数 の O(n*m) クエリ。

---

### 7. 静的ファイルのキャッシュが完全に無効
**ファイル:** `application/server/src/app.ts:16-22`

```javascript
res.header({
  "Cache-Control": "max-age=0, no-transform",  // 全レスポンスにキャッシュなし
});
```

**ファイル:** `application/server/src/routes/static.ts:16-27`

```javascript
serveStatic(UPLOAD_PATH, { etag: false, lastModified: false })
serveStatic(PUBLIC_PATH,  { etag: false, lastModified: false })
```

365MB の画像・動画が毎ページロード時に再ダウンロードされる。

---

### 8. 検索 API が 2 回フルスキャン + アプリ側でマージ・ソート
**ファイル:** `application/server/src/routes/api/search.ts:41-75`

1. テキスト検索クエリ (1 回目)
2. ユーザー名検索クエリ (2 回目・ページネーションなし)
3. アプリ側で重複除去 → sort → slice

UNION SQL 1 本で解決できる。

---

### 9. CROK (SSE) に人工的な遅延
**ファイル:** `application/server/src/routes/api/crok.ts:36-46`

```javascript
await sleep(3000);   // 初回レスポンスまで 3 秒
// ...
await sleep(10);     // 1 文字ごとに 10ms
```

---

### 10. 全画像を ArrayBuffer で取得して EXIF・サイズ解析
**ファイル:** `application/client/src/components/foundation/CoveredImage.tsx:25-39`

画像 1 枚ごとに:
1. 全データを ArrayBuffer でフェッチ (最大 6.7MB)
2. `sizeOf()` でサイズ解析
3. `load()` で EXIF 解析
4. `URL.createObjectURL()` で Blob 化

タイムライン 30 枚 = 30 回この処理が走る。`<img src>` に置き換えれば解消。

---

### 11. initialize 時に SQLite ファイルを丸ごとコピー
**ファイル:** `application/server/src/sequelize.ts:12-28`

毎回 SQLite ファイル全体を tmpdir にコピーする。DB サイズが大きいほど遅い。

---

## 🟠 MAJOR

### 12. バンドルに重い不要ライブラリが含まれる

| ライブラリ | サイズ | 問題 |
|-----------|--------|------|
| jQuery | ~87KB min+gz | `fetch()` で代替可能 |
| Lodash (フル) | ~70KB min+gz | `import _ from 'lodash'` でフル読込。ネイティブ Array メソッドで代替可能 |
| Moment.js | ~67KB min+gz | `.format("LL")` と `.fromNow()` にしか使っていない。`Intl` API で代替可能 |
| core-js / regenerator-runtime | 大 | entry に無条件追加。現代ブラウザでは不要 |

---

### 13. React.memo が一切なし
**ファイル:**
- `application/client/src/components/timeline/TimelineItem.tsx`
- `application/client/src/components/post/PostItem.tsx`
- `application/client/src/components/post/CommentItem.tsx`

親が再レンダーすると全投稿・全コメントが再レンダー。

---

### 14. 画像・動画に lazy loading がない
`loading="lazy"` や `IntersectionObserver` なし。スクロール範囲外のメディアも即時ロード。

---

### 15. useInfiniteFetch が全件取得後にクライアント側でスライス
**ファイル:** `application/client/src/hooks/use_infinite_fetch.ts:39-43`

```javascript
fetcher(apiPath).then((allData) => {
  setResult((cur) => ({
    data: [...cur.data, ...allData.slice(offset, offset + LIMIT)],  // 全件取得後に切り出し
  }));
});
```

---

### 16. 投稿一覧 API がデフォルトで全件返す
**ファイル:** `application/server/src/routes/api/post.ts:8-14`

`limit` が指定されない場合、DB の全投稿を返す。

---

### 17. ユーザー投稿取得が 2 クエリ
**ファイル:** `application/server/src/routes/api/user.ts:51-71`

User.findOne → Post.findAll の 2 クエリ。include で 1 クエリにまとめられる。

---

### 18. FFmpeg / Kuromoji の同期的ロード
- `application/client/src/utils/load_ffmpeg.ts` — WASM コア (10〜20MB) を初回使用時にブロッキングロード
- `application/client/src/utils/negaposi_analyzer.ts` — Kuromoji 辞書を同期ロード

---

### 19. 音声波形生成が毎レンダーで AudioContext を生成
**ファイル:** `application/client/src/components/foundation/SoundWaveSVG.tsx:9-29`

```javascript
const audioCtx = new AudioContext();  // 毎回生成
const buffer = await audioCtx.decodeAudioData(data.slice(0));
```

---

### 20. 公開アセットが未最適化 (365MB)

- JPEG が WebP / AVIF に変換されていない
- GIF ファイル (25MB 超のものあり) が mp4/WebM に変換されていない
- レスポンシブ画像 (srcset) なし
- プログレッシブ JPEG でない

---

## 🟡 MODERATE

### 21. セッションミドルウェアが全リクエストで実行
**ファイル:** `application/server/src/app.ts`

認証不要な GET リクエスト（画像取得等）にもセッション処理が走る。

---

### 22. bodyParser の上限が 10MB
**ファイル:** `application/server/src/app.ts:14`

```javascript
app.use(bodyParser.raw({ limit: "10mb" }));
```

大きなファイルアップロードを無制限に受け付ける。クライアント側で圧縮・リサイズすべき。

---

### 23. 画像アップロードが無圧縮で保存
**ファイル:** `application/server/src/routes/api/image.ts:16-36`

JPEG をそのまま保存。再エンコード・品質調整なし。

---

### 24. 動画・音声アップロードも無圧縮保存
- `application/server/src/routes/api/movie.ts` — GIF 25MB をそのまま保存
- `application/server/src/routes/api/sound.ts` — 無圧縮保存

---

---

## E2E テスト (`make e2e-test`) 高速化

### 現状

- テストファイル: 10ファイル、テスト数: 約30件
- 並列実行: `fullyParallel: true`、workers: `Math.max(1, floor(cpus / 2))`
- retries: 1（全テスト共通）
- テストタイムアウト: 300s（`crok-chat` の AI 応答待ちのため）

### ボトルネック一覧（影響度順）

#### 🔴 HIGH: `login()` の繰り返し呼び出し

**現状**
- `crok-chat.test.ts`: beforeEach → 2回
- `posting.test.ts`: beforeEach → 2回
- `dm.test.ts`: 各テストで個別に → 9回以上（2ページ同時ログインも含む）
- 合計: 約15回以上の login() 実行

**login() の内訳（1回あたり）**
- `page.goto("/not-found")` + `signinButton` 待ち: ~2s
- `pressSequentially` でユーザー名・パスワード入力: ~1s
- Crok リンク出現待ち: ~1s
- 合計: **~4-5s × 15回 = 60-75s**

**対策: Playwright `storageState` で認証状態を使い回す**

`globalSetup.ts` でログイン→`storageState` をファイルに保存し、`playwright.config.ts` の `use.storageState` に指定すると各テストのログインが不要になる。

注意点:
- `dm.test.ts` の WebSocket テスト（2ユーザー同時ログイン）は別途対応が必要
- `globalSetup.ts` の DB 初期化 (`/api/v1/initialize`) は維持すること

---

#### 🔴 HIGH: `pressSequentially` の多用

**現状**
- `login()`: ユーザー名・パスワードを1文字ずつ入力
- `auth.test.ts`: 全フォーム入力が `pressSequentially`
- `dm.test.ts`: DMモーダルのユーザー名入力に `{ delay: 10 }` 付き

`pressSequentially("testpass-123")` = 12文字 × 毎回 = 数百ms のオーバーヘッド

**対策**
- ログインフォームなどバリデーションが不要な箇所は `fill()` に変更
  ```ts
  await input.fill(username);  // pressSequentially より高速
  ```
- サジェスト機能が必要な箇所（Crokチャット、DMモーダル）は `pressSequentially` を維持

---

#### 🟡 MEDIUM: Crok AI応答待ち

**現状**
- `crok-chat.test.ts` の「AIの応答が表示される」テストが最大 300s のタイムアウト
- ブラウザ内 WebLLM 推論のため、テスト側からの短縮は困難

**対策**
- アプリ側で CROK の `sleep(3000)` と1文字ごとの `sleep(10)` を削除する（PERFORMANCE.md #9）
- モデルを軽量なものに差し替えることで推論速度を改善（スコアへの影響要確認）

---

#### 🟡 MEDIUM: `scrollEntire()` が遅い

**現状** (`application/e2e/src/utils.ts:102-114`)
```ts
for (let i = 0; i < scrollHeight; i += 100) {  // 100px刻み
  window.scrollTo(0, i);
  await delay(50);  // 50ms待機
}
// 往復するので2倍
// 5000px のページ → 100回 × 50ms × 2 = 約10s
```

**対策**
- ステップを 500px、ディレイを 10ms に変更 → 約10s → 約2sへ短縮

---

#### 🟡 MEDIUM: Workers 数が少ない

**現状**: `Math.floor(cpus / 2)`（8コアなら4workers）

**対策**
```bash
E2E_WORKERS=8 make e2e-test
```
アプリサーバーの負荷と相談しながら増やす。

---

#### 🟢 LOW: `retries: 1` が全テストに適用

失敗時にテストが再実行される。安定したテストには不要。
安定したテストは `retries: 0`、不安定なテストだけ個別に設定する。

---

### E2E 並列化の可能性

#### 現状の並列化

`fullyParallel: true` は既に設定済みで、ファイル間・ファイル内ともにテストが並列実行される。
ただし workers がデフォルトで `cpus / 2` のため、並列度が実際には低い。

#### テストの DB 操作分類

```
読み取りのみ（並列化しやすい）:
  home.test.ts        タイムライン閲覧、投稿クリック遷移
  terms.test.ts       利用規約閲覧
  search.test.ts      検索（DB書き込みなし）
  responsive.test.ts  ホーム閲覧
  user-profile.test.ts ユーザープロフィール閲覧
  post-detail.test.ts  投稿詳細閲覧

DB 書き込みあり（並列化で干渉リスク）:
  auth.test.ts        新規ユーザー作成（4テスト）
  posting.test.ts     投稿作成（2テスト）
  crok-chat.test.ts   ログイン・Crok 操作（直接DB書き込みは少ない）
  dm.test.ts          DM 送信・リアルタイム操作（複数テストが同一スレッドを操作）
```

#### 追加できる並列化

**① Workers 数を増やす（簡単・すぐ試せる）**

```bash
E2E_WORKERS=<cpuコア数> make e2e-test
```

制約: SQLite は write lock があるため、書き込みテストを多数並列化すると
`SQLITE_BUSY` エラーが出る可能性がある。まず読み取り専用テストで試す。

---

**② 読み取り専用テストと書き込みテストを分離実行**

Playwright の `--grep` / `--grep-invert` や project 分割で、
読み取り専用テストを高 workers で先に流し、書き込みテストを低 workers でシリアル実行する。

```ts
// playwright.config.ts
projects: [
  {
    name: "read-only",
    testMatch: ["**/home.test.ts", "**/search.test.ts", "**/terms.test.ts", ...],
    workers: os.cpus().length,  // 全コア使用
  },
  {
    name: "write",
    testMatch: ["**/auth.test.ts", "**/posting.test.ts", "**/dm.test.ts"],
    workers: 2,  // 少なめ
  },
]
```

---

**③ Playwright sharding（CI / 複数マシン向け）**

1台のマシンでは DB を共有するため効果は限定的だが、
CI で複数マシンに分散する場合は有効。

```bash
# マシン1
npx playwright test --shard=1/3
# マシン2
npx playwright test --shard=2/3
# マシン3
npx playwright test --shard=3/3
```

---

**④ SQLite を WAL モードに変更（読み取り並列化の改善）**

SQLite のデフォルトは書き込み時に全テーブルをロックするが、
WAL (Write-Ahead Logging) モードを有効にすると書き込み中でも読み取りが並列実行できる。

```sql
PRAGMA journal_mode=WAL;
```

---

#### 並列化できない・リスクが高い箇所

| テスト | 理由 |
|--------|------|
| `dm.test.ts` の WebSocket テスト | 同一 DM スレッドに複数テストが書き込む。実行順序によって既読状態・メッセージ順が変わる |
| `dm.test.ts` のソート順テスト | 他のテストの DM 送信が割り込むとソート結果が変わる |
| `auth.test.ts` の重複ユーザー名テスト | `Date.now()` でユーザー名を一意にしているため並列化可能だが、同一ミリ秒での衝突に注意 |

---

### 優先対応順（E2E テスト）

| 対策 | 実装難度 | 期待削減時間 |
|------|---------|------------|
| `storageState` で認証状態を使い回す | 中 | 60-75s |
| `pressSequentially` → `fill` | 低 | 10-20s |
| Workers 数を増やす | 低 | 並列度 × 短縮 |
| `scrollEntire` のステップ・ディレイ改善 | 低 | ~8s |
| 読み取り専用 / 書き込みテストを project 分割 | 中 | Workers 増加の恩恵を安全に受けられる |
| SQLite WAL モード | 低 | 読み取り並列化の改善 |
| CROK の sleep 削除（アプリ側） | 低 | Crok テストのみ |
| `retries` 削減 | 低 | 失敗時のみ効果 |

---

---

## 技術制約なし：導入を検討できる技術・アプローチ

### 🔴 HIGH インパクト

#### A. GIF → MP4 変換（シード生成時に処理）

**現状の問題**
- GIF ファイルは最大 25MB、`PausableMovie.tsx` がフルバイナリをダウンロードし gifler でフレームを全デコード → canvas 描画
- CPU/メモリ負荷が高く、ハードウェアデコードも効かない

**対策: シード生成時に FFmpeg で MP4 変換**

サーバーはすでに `@ffmpeg/ffmpeg` を持っており、シード生成スクリプト（Node.js 側）で変換できる。
```bash
ffmpeg -i input.gif -movflags faststart -pix_fmt yuv420p output.mp4
```
- GIF 25MB → MP4 1-2MB（ブラウザのハードウェアデコード対応）
- `<PausableMovie>` を `<video autoPlay loop muted playsInline>` に置き換えるだけ
- `gifler`, `omggif` をバンドルから削除できる（バンドルサイズ削減）

---

#### B. 画像メタデータをサーバー側で保持（EXIF クライアント解析をなくす）

**現状の問題**（`CoveredImage.tsx`）
- 画像をフルバイナリでダウンロード（最大数MB）
- クライアントで `image-size` + `piexifjs` で幅・高さ・ALTテキストを解析
- 1枚ごとにこの処理 → タイムライン30枚で30回実行

**対策**
- 画像アップロード時にサーバー側で幅・高さ・ALTテキストを抽出して DB に保存
- API レスポンスに含める（`image.width`, `image.height`, `image.alt`）
- クライアントは `<img src={src} />` + CSS `object-fit: cover` のみ
- `image-size`, `piexifjs`, `useFetch` を `CoveredImage.tsx` から排除できる

---

#### C. 音声波形をサーバー側で事前計算

**現状の問題**（`SoundWaveSVG.tsx`）
- レンダリングのたびに `AudioContext` を生成、音声データを全デコード
- lodash でサンプリング・平均化処理（CPU 負荷大）

**対策**
- 音声アップロード時に 100 点の peaks データを計算して DB に保存
- クライアントは peaks 配列を API から受け取り SVG を描画するだけ
- `AudioContext`, `lodash`, `standardized-audio-context` が不要になる

---

#### D. Nginx / Caddy をリバースプロキシとして追加

**現状の問題**
- `Connection: close` が全レスポンスに設定されており HTTP keep-alive が無効
- Brotli 圧縮なし（Brotli は gzip より 15-25% 小さい）
- HTTP/1.1 のみ（HTTP/2 なし → 並列リクエストに制限あり）
- 静的アセットにキャッシュヘッダーなし

**Nginx 設定で解決できること**
```nginx
gzip on;
brotli on;                              # ngx_brotli モジュール
http2 on;                               # HTTP/2
location ~* \.(js|css|woff2|jpg|webp)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

Dockerfile に Nginx を追加し Express をリバースプロキシ経由で配信するだけ。

---

#### E. React.lazy + Suspense による重いルートの遅延読み込み

**現状の問題**
- Crok（Web LLM）、投稿モーダル（FFmpeg + ImageMagick）が全員のバンドルに含まれる
- Web LLM (`@mlc-ai/web-llm`) は単体で数十MB の WASM + モデルファイル

**対策**
```tsx
// ルートレベルで遅延読み込み
const CrokContainer  = React.lazy(() => import("./containers/CrokContainer"));
const NewPostModal   = React.lazy(() => import("./containers/NewPostModalContainer"));
```
- タイムラインの初期表示に Crok/FFmpeg が不要になる
- TBT（Total Blocking Time）が大幅改善

---

### 🟡 MEDIUM インパクト

#### F. Service Worker によるキャッシュ（Workbox）

- 静的アセット（JS/CSS/フォント）を Service Worker でキャッシュ
- リピートビジット時の Lighthouse スコアが大幅向上
- `workbox-webpack-plugin` で Webpack と統合可能

---

#### G. 画像を WebP / AVIF に変換（`sharp` で一括）

```bash
# シード生成後に sharp で変換
for img in public/images/*.jpg; do
  sharp "$img" -o "${img%.jpg}.webp"
done
```
- JPEG → WebP: 平均 30-50% 削減
- サーバー側で Accept ヘッダーを見て WebP/AVIF を返す、または `<picture>` を使う

---

#### H. DB インデックス追加

検索・タイムライン取得で使われるカラムにインデックスがない場合、フルスキャンが発生する。

```sql
CREATE INDEX idx_posts_created_at ON Posts(createdAt DESC);
CREATE INDEX idx_posts_user_id ON Posts(userId);
CREATE INDEX idx_posts_text ON Posts(text);  -- FTS5 の方が高速
```

特に全文検索は SQLite の FTS5 (Full-Text Search) を使うと劇的に改善する。

---

#### I. `moment` → `Intl.DateTimeFormat`、`lodash` → ネイティブメソッド

**`TimelineItem.tsx`**
```tsx
// Before
moment(post.createdAt).locale("ja").format("LL")
// After（バンドルへの追加ゼロ）
new Intl.DateTimeFormat("ja", { dateStyle: "long" }).format(new Date(post.createdAt))
```

**`SoundWaveSVG.tsx`**（波形の事前計算が難しい場合でも）
```ts
// lodash.map, lodash.chunk, lodash.mean → ネイティブ Array メソッドに置換
```

moment (~67KB min+gz) + lodash (~70KB min+gz) = 137KB 削減

---

#### J. Web Worker で重い計算をオフロード

音声波形・画像サイズ解析など重い処理をメイン thread から切り離す。

```ts
// SoundWaveSVG: AudioContext のデコード処理を Worker に移動
const worker = new Worker(new URL("./waveform.worker.ts", import.meta.url));
worker.postMessage(soundData, [soundData]);
```

TBT（メインスレッドのブロック時間）が改善される。

---

### 優先度まとめ（技術制約なし追加分）

| 対策 | 実装難度 | Lighthouse への影響 |
|------|---------|-------------------|
| GIF → MP4 変換（シード時） | 中 | LCP・TBT・転送量 |
| 画像メタデータをサーバーで保持 | 中 | LCP・TBT |
| Nginx 追加（HTTP/2・Brotli・キャッシュ） | 低 | 全スコア |
| React.lazy で Crok/投稿モーダルを分割 | 低 | TBT・TTI |
| 音声波形をサーバー側で事前計算 | 中 | TBT |
| WebP/AVIF 変換 | 低 | LCP・転送量 |
| Service Worker (Workbox) | 低 | リピート訪問スコア |
| SQLite FTS5 で検索高速化 | 低 | サーバー応答時間 |
| moment / lodash を削除 | 低 | TBT・バンドルサイズ |

---

## 優先対応順（費用対効果）

| 優先度 | 対応内容 | 期待効果 |
|--------|----------|----------|
| 1 | Webpack minification + code splitting 有効化 | JS 転送量 -90% |
| 2 | Cache-Control ヘッダー修正 | リピートロード -80% |
| 3 | jQuery → fetch 置き換え (async: false 排除) | TTFB・TTI 大幅改善 |
| 4 | InfiniteScroll を IntersectionObserver に置き換え | スクロール FPS 改善 |
| 5 | Post defaultScope のリレーション削除・必要な箇所で明示的 include | DB クエリ -70% |
| 6 | 静的アセットを WebP / mp4 に変換 | 転送量 -60〜80% |
| 7 | React.memo で TimelineItem / PostItem をメモ化 | Re-render 削減 |
| 8 | Moment.js → Intl API、Lodash → ネイティブ | バンドル -140KB |
| 9 | 画像を `<img src>` に変更 (CoveredImage) | 画像ロード時間 -90% |
| 10 | CROK の sleep 削除 | AI チャット応答速度 改善 |
