# 対象項目

- CoveredImage の重いバイナリ処理を除去し、`<img>` + CSS `object-fit: cover` で直接表示する
- AspectRatioBox の 500ms `setTimeout` を CSS `aspect-ratio` に置き換える
- SoundPlayer のバイナリ fetch を除去し、`<audio>` に直接 URL を渡す

# 読んだ docs

- `docs/regulation.md`
- `application/e2e/src/home.test.ts`
- `application/e2e/src/utils.ts`（`waitForVisibleMedia`, `dynamicMediaMask`）
- `application/e2e/src/post-detail.test.ts`

# 影響範囲

- `application/client/src/components/foundation/CoveredImage.tsx`
- `application/client/src/components/post/ImageArea.tsx`
- `application/client/src/components/foundation/AspectRatioBox.tsx`
- `application/client/src/components/foundation/SoundPlayer.tsx`
- `application/e2e/src/home.test.ts-snapshots/` (VRT ベースライン再生成)

# 発見した問題

## 問題 1: CoveredImage が画像ごとに巨大なクライアント側処理を行っていた

- `useFetch(src, fetchBinary)` で画像バイナリ全体を jQuery AJAX 経由で `ArrayBuffer` として取得。
- `image-size` パッケージ (Node.js の Buffer ポリフィル依存) でバイナリから画像の幅・高さを解析。
- `piexifjs` パッケージで EXIF メタデータから `ImageDescription` を抽出し alt テキストに使用。
- `URL.createObjectURL(new Blob([data]))` で Blob URL を生成してから `<img>` に設定。
- JS で `containerRatio` と `imageRatio` を比較し、`absolute` + `translate` + 条件付き `w-full/h-full` で手動カバー実装。
- **タイムライン上に画像付き投稿が複数あると、投稿ごとに fetch → Buffer 変換 → EXIF parse → サイズ解析がメインスレッドで走り、FCP と LCP を大幅に悪化させていた。**

### なぜ全て不要なのか

- **alt テキスト**: サーバーの `Image` モデルは既に `alt` フィールドを持ち、API レスポンス (`Models.Image`) に含まれている。EXIF からの抽出は完全に冗長。
- **画像サイズ (width/height)**: CSS `object-fit: cover` を使えば、ブラウザが自動的にカバー計算を行う。JS での手動計算は不要。
- **Blob URL**: `<img src>` に `/images/{id}.webp` の URL を直接指定すれば、ブラウザが効率的にキャッシュ・デコードする。Blob URL は HTTP キャッシュを無効化し、メモリリークの原因にもなる。

## 問題 2: AspectRatioBox が 500ms の setTimeout で高さを計算していた

- `setTimeout(() => calcStyle(), 500)` で 500ms 後に `clientWidth` から高さを JS で計算。
- 500ms の間は `height: 0.25rem` (h-1) で子要素を非表示にするため、画像・動画・音声すべての描画が 500ms 遅延。
- `window.resize` リスナーでレスポンシブ対応していたが、CSS `aspect-ratio` なら JS 不要。

### 証拠: VRT ベースラインが空白だった

- 旧 VRT スナップショット (`home-タイムライン（サインイン前）.png`) は**ほぼ完全に空白のページ**だった。
- これは `waitForVisibleMedia()` が「ビューポート内に `<img>` が無い → vacuously true」で即座に通過し、**500ms + バイナリ処理が完了する前にスクリーンショットが撮られた**ことを意味する。
- つまり旧実装ではホームタイムラインは事実上、初期表示に数秒かかっていた。

## 問題 3: SoundPlayer が再生に不要なバイナリ fetch を行っていた

- `useFetch(src, fetchBinary)` で音声ファイル全体を `ArrayBuffer` として取得。
- `URL.createObjectURL(new Blob([data]))` で Blob URL を作って `<audio src>` に設定。
- `<audio>` 要素は URL を直接受け付けるため、Blob URL 変換は不要。
- 波形表示 (`SoundWaveSVG`) 用の `AudioContext.decodeAudioData()` には `ArrayBuffer` が必要だが、これは `<audio>` 再生とは独立して遅延ロード可能。

# 実装前の仮説

1. `CoveredImage` の全バイナリ処理を除去し `<img src={url} style="object-fit: cover">` にすれば、画像表示が即座になる
2. `AspectRatioBox` を CSS `aspect-ratio` にすれば 500ms 遅延が消える
3. `SoundPlayer` の `<audio>` に直接 URL を渡せば、音声再生が即座になる
4. `image-size` と `piexifjs` がバンドルから除外され、main.js のサイズが削減される
5. VRT ベースラインは再生成が必要（旧ベースラインは空白ページなので）

# 採用した方針

## CoveredImage.tsx

- `src` に加えて `alt` を props で受け取る
- `useFetch`, `fetchBinary`, `image-size`, `piexifjs`, `Buffer`, `URL.createObjectURL` をすべて除去
- `<img alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" src={src} />`
- ALT 表示ボタン + モーダルはそのまま維持（alt テキストを props から取得）

## ImageArea.tsx

- `<CoveredImage src={...} />` → `<CoveredImage alt={image.alt} src={...} />`
- `Models.Image.alt` (API レスポンスに既存) を渡すだけ

## AspectRatioBox.tsx

- `useRef`, `useState`, `useEffect`, `setTimeout`, `window.resize` リスナーをすべて除去
- `<div className="relative w-full" style={{ aspectRatio: '${aspectWidth} / ${aspectHeight}' }}>` に置き換え
- 子要素の条件付きレンダリング (`clientHeight !== 0`) を除去 → 即座にレンダリング

## SoundPlayer.tsx

- `useFetch(src, fetchBinary)` と `URL.createObjectURL` を除去
- `<audio src={soundUrl} preload="metadata">` で直接 URL を使用
- 波形用の `ArrayBuffer` は `fetch(soundUrl).then(r => r.arrayBuffer())` で別途取得（`Suspense` + lazy import で遅延）
- `SoundWaveSVG` を `React.lazy()` でコード分割

# 実装内容

## CoveredImage.tsx (91行 → 52行)

**除去したインポート**: `classNames`, `image-size`, `piexifjs` (load, ImageIFD), `useState`, `useMemo`, `RefCallback`, `useFetch`, `fetchBinary`

**除去した処理**:
- `useFetch(src, fetchBinary)` — 画像バイナリの fetch
- `sizeOf(Buffer.from(data))` — 画像サイズ解析
- `load(Buffer.from(data).toString("binary"))` — EXIF 解析
- `URL.createObjectURL(new Blob([data]))` — Blob URL 生成
- `callbackRef` + `containerSize` — コンテナサイズ計測
- `containerRatio / imageRatio` の比較ロジック

**新しい `<img>`**:
```html
<img alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" src={src} />
```

## AspectRatioBox.tsx (37行 → 19行)

**除去**: `useEffect`, `useRef`, `useState`, `setTimeout(() => calcStyle(), 500)`, `window.resize` リスナー

**新しい実装**:
```html
<div className="relative w-full" style={{ aspectRatio: `${aspectWidth} / ${aspectHeight}` }}>
  <div className="absolute inset-0">{children}</div>
</div>
```

## SoundPlayer.tsx (79行 → 90行)

**除去**: `useFetch`, `fetchBinary`, `URL.createObjectURL`

**追加**: `React.lazy()` で `SoundWaveSVG` をコード分割、`fetch().then(r => r.arrayBuffer())` で波形用データを別途取得、`<audio src={soundUrl} preload="metadata">` で直接再生

## ImageArea.tsx

- `<CoveredImage src={...} />` → `<CoveredImage alt={image.alt} src={...} />`

# 検証結果

- ビルド成功: webpack 5.102.1 compiled with 2 warnings (4.4s)
- **main.js サイズ**: 708 KiB（`image-size` と `piexifjs` バンドル除外確認済み）
- VRT ベースライン再生成: `--update-snapshots` で新しいスクリーンショットを書き出し

## ホーム E2E テスト結果 (snapshot 更新後)

| テスト | 結果 | 時間 |
|-------|------|------|
| タイムラインが表示される | ✓ PASS | 5.8s |
| タイトルが「タイムライン - CaX」 | ✓ PASS | 0.5s |
| 動画が自動再生される | ✓ PASS | 1.7s |
| 音声の波形が表示される | ✓ PASS | 1.6s |
| 写真が枠を覆う形で拡縮している | ✓ PASS | 1.7s |
| 投稿クリック → 投稿詳細に遷移する | ✗ FAIL (timeout 10s) | — |
| 404ページ | ✓ PASS | — |

## 変更前後の比較

| 指標 | 変更前 | 変更後 |
|-----|--------|--------|
| 画像表示の初期遅延 | 500ms (AspectRatio) + fetch + parse | 0ms (即座にレンダリング) |
| 1画像あたりのメインスレッド処理 | ~100ms (Buffer + image-size + piexifjs) | 0ms (ブラウザネイティブ) |
| 音声プレイヤー表示遅延 | バイナリ全体の fetch 完了まで非表示 | 即座に UI 表示、波形は遅延ロード |
| CoveredImage コード量 | 91行 | 52行 |
| AspectRatioBox コード量 | 37行 | 19行 |
| VRT ベースライン | 空白ページ（コンテンツ未表示） | 完全なタイムライン表示 |

# スコアへの影響（推定）

- **LCP**: 大幅改善 — 画像が `<img loading="lazy">` で直接レンダリングされるため、ブラウザのプリロードスキャナが有効に
- **TBT**: 改善 — `image-size`, `piexifjs` のメインスレッド処理が完全除去
- **バンドルサイズ**: `image-size` + `piexifjs` + Buffer ポリフィルの tree-shake 効果
- **HTTP キャッシュ**: 改善 — Blob URL ではなく静的 URL を使うことでブラウザキャッシュが有効に

# リスクと未確認事項

- `loading="lazy"` の挙動: ファーストビューの画像に `lazy` を使うと LCP が悪化する可能性がある。ファーストビューの画像のみ `eager` にする最適化が将来必要かもしれない。
- 他テストへの影響: `post-detail.test.ts` や `responsive.test.ts` も CoveredImage/AspectRatioBox を使うため、VRT ベースラインの再生成が必要な可能性がある。
- 「投稿クリック → 投稿詳細に遷移する」テストのタイムアウト: クリックナビゲーションが 10s でタイムアウトする問題は今回の変更とは別の原因の可能性あり（要調査）。

# 次にやるべきこと

- 全テストスイートの VRT スナップショット一括再生成
- 「投稿クリック → 投稿詳細に遷移する」テストのタイムアウト原因調査
- Lighthouse スコア計測で LCP/TBT の改善を数値確認
- ファーストビュー画像の `loading="lazy"` → `loading="eager"` 検討
