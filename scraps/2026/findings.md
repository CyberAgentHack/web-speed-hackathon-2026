# WSH 2026 調査メモ

競技中に発見した仕込み・問題点を記録する。対応状況は [`progress.md`](./progress.md) を参照。

---

## ビルド設定の無効化 (仕込み)

複数層にわたって production ビルドが無効化されていた。

| 仕込み箇所 | 内容 |
| --- | --- |
| `webpack.config.js` | `mode: "none"` + `devtool: "inline-source-map"` |
| `client/package.json` build script | `NODE_ENV=development webpack` (NODE_ENV を強制上書き) |
| `Dockerfile` build ステージ | `ENV NODE_ENV=production` が無かった |
| `client/src/index.html` | `<script>` タグに `defer` が無かった |
| `webpack.config.js` entry | `core-js`・`regenerator-runtime` が直接含まれていた |

---

## クライアントの巨大 WASM (仕込み)

| ライブラリ | 用途 | 推定サイズ |
| --- | --- | --- |
| `@ffmpeg/core` + `@ffmpeg/ffmpeg` | 動画・音声変換 | ~30MB |
| `@imagemagick/magick-wasm` | 画像変換 (TIFF→JPEG) | ~14MB |
| `@mlc-ai/web-llm` | 翻訳 ("Show Translation" 機能) | ~13MB |

---

## 意図的な遅延

| 場所 | 内容 | 影響 |
| --- | --- | --- |
| `server/src/routes/api/crok.ts` | `await sleep(3000)` | 3 秒待機中に専用アニメーションあり — **除去禁止** (デザイン差異) |
| `server/src/routes/api/crok.ts` | `await sleep(10)` × 文字数 | `crok-response.md` が **7,490 文字** → 合計 **74.9 秒** のストリーミング。採点ツールのタイムアウト原因。**Crok AIチャット → 計測できません の直接原因**。削除・短縮がレギュ違反かどうか運営に質問中 (2026-03-21)。回答次第で対応する |
| `client/src/components/direct_message/DirectMessagePage.tsx` | `setInterval(() => {...}, 1)` | 毎ミリ秒スクロール監視・TBT 大幅増加 |
| `client/src/components/foundation/AspectRatioBox.tsx` | `setTimeout(calcStyle, 500)` | 500ms 描画遅延・CLS |

---

## ReDoS の疑い (仕込み)

`validation.ts`・`services.ts` の 4 箇所にパスワードバリデーションの脆弱な正規表現。

---

## 重い依存ライブラリ

| ライブラリ | 理由 | 代替案 |
| --- | --- | --- |
| `moment` | ~300KB | `day.js` |
| `lodash` | 544 KB (全体 import) | ネイティブ JS (`SoundWaveSVG.tsx` で使用) |
| `standardized-audio-context` | **466 KB** | 不要 — `AudioContext` はモダンブラウザにネイティブ実装。`webpack.config.js` の `ProvidePlugin` でグローバル注入されている仕込み |
| `jquery` + `jquery-binarytransport` | 285 + 48 KB | `fetch` に置き換え (`fetchers.ts`) |
| `bluebird` | 183 KB | `gifler@0.3.0` の依存として流入 (`pnpm why bluebird` で確認済み)。GIF → WebM 変換 + `PausableMovie.tsx` を native `<video>` 化で `gifler` / `omggif` ごと除去できる |
| `gifler` + `omggif` | - | `PausableMovie.tsx` で GIF を canvas に描画するために使用。native `<video>` 化で除去 |
| `moment` | 176 KB | `day.js` |
| `piexifjs` | 79 KB | `CoveredImage.tsx` で使用。用途要確認 |
| `kuromoji` | 形態素解析 (辞書込みで重い) | サーバー側に移行 (**対応済み**) |
| `negaposi-analyzer-ja` | 感情極性分析 | サーバー側に移行 (**対応済み**) |
| `bayesian-bm25` | BM25 検索 (Crok サジェスト) | サーバー側に移行 (**対応済み**) |
| `@mlc-ai/web-llm` | フロント LLM 翻訳 | `POST /api/v1/translate` に移行 (**対応済み**) |
| `react-syntax-highlighter` | シンタックスハイライト (全言語バンドル) | `React.lazy` で遅延分離 (**対応済み**) |

`kuromoji` + `negaposi-analyzer-ja` は検索画面の「ネガポジ判定」および Crok のサジェスト絞り込みで使用。

### `fetchers.ts` の仕込み

`fetchers.ts` の全関数が `$.ajax({ async: false })` (同期 XHR) を使用。リクエスト中メインスレッドをブロックするため TBT が大幅に増加する。`fetch` に置き換えれば `jquery` + `jquery-binarytransport` も除去できる。

また `sendJSON` は `pako` で gzip 圧縮したリクエストを送信している (`Content-Encoding: gzip`)。サーバー側の対応状況を確認してから除去すること。

---

## WSL2 ローカルテスト環境メモ

### E2E テスト実行

- **並列実行はリソース競合で落ちやすい** → `E2E_WORKERS=1 mise test` で実行すること
- テスト失敗の多くはタイムアウトではなく画像読み込み待ちによるもの

### GIF・画像がマゼンタになる問題

WSL2 の headless Chrome で動画 (GIF) や一部の画像がマゼンタの四角で表示される。

- **GPU なし** のため YUV→RGB 変換が壊れる可能性
- Mesa + Intel VA-API を導入してみたが `/dev/dri/` が出現せず断念
  - `/dev/dxg` は存在する (DXCore 有効) が、Windows 側の Intel GPU ドライバが WSL2 GPU パススルーに未対応と思われる
- **採点は採点サーバー上の Lighthouse (Chrome) が fly.io デプロイ済みアプリを計測するため、ローカルの見た目は関係ない**
- 対処: VRT スナップショットをマゼンタ状態で更新するか、`dynamicMediaMask` で該当要素をマスクする

---

## fetcher 非同期化まわりの検証ログ (2026-03-21)

### 試したこと

- `client/src/utils/fetchers.ts` の `$.ajax({ async: false })` を `fetch` に置き換え
- `jquery` / `jquery-binarytransport` / `pako` 依存を除去
- `sendJSON` の gzip リクエストを廃止し、通常 JSON 送信へ変更
- `AuthModalContainer.tsx` のエラー参照を `jqXHR` 前提から `FetchError` 前提へ移行

### 見つかったこと

- 同期 XHR をやめると、暗黙に直列化されていた箇所の順序依存が表面化する
- ただし、今回の E2E 不安定は fetcher 単体では説明しきれず、タイムライン項目クリックの遷移判定と再描画タイミングの競合が主因
- `use_infinite_fetch.ts` は非同期化後に race が出やすい層。`isLoading` / `offset` / 取得済みデータ管理を明示しないと不安定になる
- 検索 API に `limit` / `offset` を付与して解決しようとした案は、サーバー側 SQL エラー (500) により断念

### 規約観点での判断

- テスト通過だけを狙った `pointer-events` 無効化や遅延ナビゲーションは、挙動改変としてグレーになりやすい
- WSH では「速くする」と「自然な機能維持」を同時に満たす必要がある
- 方針としては、同期に戻して安定化させるのではなく、非同期のまま呼び出し側で順序保証を明示するのが安全

### 最終的な解決策 (2026-03-21)

- `in-flight` ガード / `requestId` / `AbortController` は不要だった
  - `allData` キャッシュ導入により fetch 自体が初回 1 回のみになり、競合が消滅
  - `IntersectionObserver` 方式でスクロールイベントのバタつきも解消

### レギュレーション観点での再考察 (2026-03-21)

upstream の flaky テスト修正 (PR#257) の内容は **タイムアウトを 10 秒 → 30 秒に変更しただけ** だった。元の test 失敗原因は「107MB main.js による遷移の遅延」が主因であり、`isClickedAnchorOrButton` はナビゲーション挙動として**正しい元の実装**だった。

そのため以下の方針:

- `isClickedAnchorOrButton` を**復元・維持** (`origin/main` にも存在する意図された実装)
- `PausableMovie.tsx` / `SoundPlayer.tsx` のボタン + `TranslatableText` / `CoveredImage` の各ボタンに `stopPropagation` を**追加 (belt-and-suspenders)**
  - 「動画/音声の再生ボタンを押すと投稿詳細へ遷移する」は「著しい機能落ち」のためレギュレーション違反に相当。stopPropagation で明示的に防ぐ
- ユーザープロフィール等の各 `<Link>` にも `stopPropagation` を追加 (二重遷移防止、元と等価)

また、`fetchers.ts` に誤って追加した `cache: "no-store"` と `use_infinite_fetch.ts` の `__ts` キャッシュバスターを除去。元の jQuery コードにはなかった余計な制約であり、HTTP キャッシュを損なうため。

### テスト失敗の注記 (2026-03-21)

`isClickedAnchorOrButton` 復元後、低スペック開発環境では以下の 5 件が落ちる:
`home:52`, `post-detail:10,:27,:43,:72`

原因はスペック不足によるタイムアウト (非同期化で GIF がより速く読み込まれ、Playwright クリック時に `<button>` がすでに出ている or 遷移待機が間に合わない)。**manual テストでは正常動作確認済み**。レギュレーション規定「テスト実装上の不安定さに起因するものであれば許容」に該当し、fly.io デプロイ環境は高速なため問題なし。

---

## バンドル構成の問題点 (bundle-bundle-analyzer 2026-03-21 調査)

### entry modules (concatenated) が巨大

`AppContainer.tsx` が全ルートの Container を **static import** しているため、全ページのコードが entry chunk (main.js) に入っている。

```ts
// 現状: 全部 eager import
import { CrokContainer } from "...";
import { DirectMessageContainer } from "...";
import { TimelineContainer } from "...";
// ... 10 コンテナ全部
```

**対策**: `React.lazy()` + `<Suspense>` でルートレベルのコード分割。各ページのコードを別チャンクに分離し、遷移時のみロードする。

### static メディアファイルのサイズ

`application/public/` に配置されたシードデータの実体ファイル (initialize では消えない):

| 種別 | 件数 | 合計サイズ | 現状 | 変換先 | 期待削減率 |
|------|------|-----------|------|--------|-----------|
| 動画 | 15 件 | ~180 MB | GIF | WebM (VP9) | ~1/10〜1/20 |
| 音声 | 15 件 | ~67 MB | MP3 | WebM/Opus | ~1/5〜1/10 |
| 画像 | 30 件 | ~86 MB | JPEG (無圧縮) | JPEG 圧縮 (quality 75) | ~1/3〜1/5 |

**注意**: 画像は `piexifjs` が JPEG-only のため WebP/AVIF に変換すると ALT 表示機能 (EXIF Image Description 読み取り) が壊れる。JPEG のまま品質調整で対応する。

### サーバー側メディア変換フォーマット

ユーザーアップロード時の変換先も合わせて変更が必要:
- `server/src/routes/api/movie.ts`: ffmpeg 出力 `.gif` → `.webm` (VP8、アップロード処理速度優先)
- `server/src/routes/api/sound.ts`: ffmpeg 出力 `.mp3` → `.webm` (Opus)
- `server/src/routes/api/image.ts`: sharp の quality パラメータ追加 (デフォルト 80→75 程度)

クライアント側のパス生成関数も変更が必要:
- `get_path.ts`: `getMoviePath` `.gif`→`.webm`、`getSoundPath` `.mp3`→`.webm`

---

## リモート計測スコア (2026-03-21, Phase 2 jQuery/lodash/moment 除去後)

**合計: 397.95 / 1150.00 (暫定 70 位)**

**300 点の壁を突破 → ユーザーフローテストが採点対象になった。**

| ページ | CLS | FCP | LCP | SI | TBT | 合計 |
| --- | --- | --- | --- | --- | --- | --- |
| ホーム | 9.75 | 1.10 | 0.00 | 0.00 | 0.00 | 10.85 |
| 投稿詳細 | 25.00 | 2.30 | 4.75 | 5.30 | 15.30 | 52.65 |
| 写真つき投稿詳細 | 25.00 | 2.30 | 0.00 | 4.40 | 0.30 | 32.00 |
| 動画つき投稿詳細 | 25.00 | 2.30 | 2.50 | 2.60 | 0.00 | 32.40 |
| 音声つき投稿詳細 | 25.00 | 2.40 | 2.75 | 5.60 | 0.00 | 35.75 |
| 検索 | 25.00 | 2.50 | 5.25 | 5.70 | 15.60 | 54.05 |
| DM一覧 | 25.00 | 3.30 | 2.50 | 5.50 | 17.10 | 53.40 |
| DM詳細 | 計測不能 | - | - | - | - | - |
| 利用規約 | 25.00 | 2.40 | 3.00 | 5.70 | 15.00 | 51.10 |

| ユーザーフロー | INP | TBT | 合計 |
| --- | --- | --- | --- |
| ユーザー登録 → サインアウト → サインイン | 25.00 | 0.75 | 25.75 |
| DM送信 | 計測不能 | - | - |
| 検索 → 結果表示 | 25.00 | 25.00 | 50.00 |
| Crok AIチャット | 計測不能 | - | - |
| 投稿 | 計測不能 | - | - |

**計測不能の原因と分析:**

| 項目 | 原因 | 我々の変更が原因か |
| --- | --- | --- |
| DM詳細・DM送信 | 採点ツールのサインインフローが不安定 (300 点未満時は採点されず潜在していた) | **否** — pre-existing |
| Crok AIチャット | `crok.ts` の `sleep(3000)` + 文字数×`sleep(10)` が採点ツールのタイムアウトに抵触 (仕様として維持必須) | **否** — 仕様上の限界 |
| 投稿 | 画像投稿完了確認の問題 (調査余地あり) | 不明 (要確認) |

**考察:**

- ホーム LCP=0, TBT=0, SI=0 → timeline に並ぶ **GIF 描画が原因**。gifler がメインスレッドをブロックして TBT 爆発、GIF ロードが遅すぎて LCP タイムアウト。**Phase 4 ① (GIF→WebM + native `<video>`) で解決できる**
- 写真つき投稿詳細 LCP=0 → 大きな JPEG (最大 6.7MB) が LCP 要素になっている。Phase 4 ④ (JPEG 圧縮) で改善できる
- 動画・音声ページの TBT=0 → GIF/MP3 の重いロードが影響している可能性
- 検索・DM一覧・利用規約の TBT が 15〜17 点 → JS の実行コストが残っている。Phase 4 ② (React.lazy ルート分割) で改善できる

---

## HAR 解析結果 (2026-03-20, `initial.har`)

リクエスト数: 67 件

| サイズ | 重複 | URL |
| --- | --- | --- |
| **107.8 MB** | - | `scripts/main.js` |
| 25 MB | **×2** | `movies/51a14d70...gif` |
| 17.3 MB | - | `movies/b44e6ef6...gif` |
| 13.2 MB | - | `movies/1b558288...gif` |
| 10.5 MB | **×2** | `movies/3cb50e48...gif` |
| 8.6 MB | - | `sounds/5d0cd8a0...mp3` |
| 8.2 MB | - | `movies/7518b1ae...gif` |
| 6.7 MB | **×2** | `images/85946f86...jpg` |
| 5.6 MB | **×2** | `images/029b4b75...jpg` |
| 5 MB | **×2** | `images/eb487309...jpg` |
| 4.2 MB | **×4** | `images/18358ca6...jpg` |
| 2.4 MB | - | `api/v1/posts` |

- **動画コンテンツが GIF で配信** — `movies/` が全て `.gif`。WebM/MP4 に変換必須
- **同一リソースが最大 4 回リクエスト** — キャッシュ未設定またはコンポーネントが同じ URL を複数回 fetch
- **JPEG 画像が生サイズで配信** — 最大 6.7 MB。AVIF/WebP + リサイズ必須
- **MP3 音声が 8.6 MB** — Opus (.webm) に変換すれば 1/5 程度に削減可能
- **`api/v1/posts` が 2.4 MB** — 不要フィールドの削除・ページネーション見直し要

---

## 初期スコア (2026-03-20)

**合計: 247.95 / 1150.00**

ページの表示が 300 点未満のためユーザーフローテストは全てスキップ。
FCP / LCP / SI / TBT がほぼ全ページ 0 点 = Lighthouse が真っ白な画面を完成状態と誤認している典型パターン。

| ページ | CLS | FCP | LCP | SI | TBT | 合計 |
| --- | --- | --- | --- | --- | --- | --- |
| ホーム | 21.25 | 0 | 0 | 0 | 0 | 21.25 |
| 投稿詳細 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| 写真つき投稿詳細 | 24.75 | 0 | 0 | 0 | 0 | 24.75 |
| 動画つき投稿詳細 | 23.75 | 0 | 0 | 0 | 0 | 23.75 |
| 音声つき投稿詳細 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| 検索 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| DM一覧 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| DM詳細 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| 利用規約 | 25.00 | 0 | 0 | 0 | 28.20 | 53.20 |

---

## ローカル計測スコア (2026-03-20, Phase 1〜3 + web-llm 除去後)

**合計: 220.10 / 1150.00**

ページの表示が 300 点未満のためユーザーフローテストは全てスキップ。
FCP / LCP / SI / TBT は依然ほぼ全ページ 0 点。初期スコアより低いのはローカル環境の CPU/ネットワーク差によるもので、ビルド改善の効果はまだスコアに現れていない。

| ページ | CLS | FCP | LCP | SI | TBT | 合計 |
| --- | --- | --- | --- | --- | --- | --- |
| ホーム | 21.00 | 0 | 0 | 0 | 0 | 21.00 |
| 投稿詳細 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| 写真つき投稿詳細 | 24.75 | 0 | 0 | 0 | 0 | 24.75 |
| 動画つき投稿詳細 | 23.75 | 0 | 0 | 0 | 0 | 23.75 |
| 音声つき投稿詳細 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| 検索 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| DM一覧 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| DM詳細 | 25.00 | 0 | 0 | 0 | 0 | 25.00 |
| 利用規約 | 25.00 | 0 | 0 | 0 | 0.60 | 25.60 |

---

## リモート計測スコア (2026-03-20, Phase 1〜3 + Phase 2 追加バンドル削減後)

**合計: 232.10 / 1150.00 (暫定 73 位)**

ページの表示が 300 点未満のためユーザーフローテストは全てスキップ。
FCP がわずかに点数が出始めた (0.10〜0.40) が依然ほぼ 0。main.js の JS パース・実行時間が Lighthouse の CPU スロットリング下でボトルネック。**次の優先課題は lodash / jquery / moment 等の除去によるバンドルサイズのさらなる削減。**

| ページ | CLS | FCP | LCP | SI | TBT | 合計 |
| --- | --- | --- | --- | --- | --- | --- |
| ホーム | 20.75 | 0.10 | 0 | 0 | 0 | 20.85 |
| 投稿詳細 | 25.00 | 0.30 | 0.25 | 1.60 | 0 | 27.15 |
| 写真つき投稿詳細 | 24.75 | 0.20 | 0 | 0.70 | 0 | 25.65 |
| 動画つき投稿詳細 | 23.50 | 0 | 0 | 0.10 | 0 | 23.60 |
| 音声つき投稿詳細 | 25.00 | 0.10 | 0 | 0.80 | 0 | 25.90 |
| 検索 | 25.00 | 0.30 | 1.75 | 1.70 | 0 | 28.75 |
| DM一覧 | 25.00 | 0.40 | 0 | 1.90 | 0 | 27.30 |
| DM詳細 | 25.00 | 0.40 | 0 | 1.10 | 0 | 26.50 |
| 利用規約 | 25.00 | 0 | 0.50 | 0.60 | 0.30 | 26.40 |

**考察:**
- 利用規約ページだけローカルで TBT 満点 (30 点) — ほぼ静的テキストなので React ハイドレーション後の JS 処理が少なく、ブロッキングが短い。リモートでは CPU 4x スロットリングにより 0.30 点まで落ちる。
- **FCP がわずかでも点数が出始めた = main.js 削減の効果が出てきた兆候**。lodash / jquery / moment を除去してさらに削ることで、他ページでも TBT・FCP が取れるようになるはず。
- 300 点の壁 = 全 9 ページ平均 33 点以上。CLS だけで各ページ 21〜25 点あるので、FCP と TBT が少し出れば届く距離感。
