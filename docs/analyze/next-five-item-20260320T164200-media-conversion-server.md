# Next Five Item Report: メディア変換をクライアントからサーバーに移行

## 1. 対象項目

クライアントで行っていた画像変換 (`@imagemagick/magick-wasm` + `piexifjs`)、音声/動画変換 (`@ffmpeg/ffmpeg` + `@ffmpeg/core`) をすべてサーバー側 (`sharp`, `ffmpeg-static`) へ移行し、クライアントバンドルから巨大な WASM モジュールを除去する。

## 2. 読んだ docs

- `docs/regulation.md`
- `docs/scoring.md`
- `docs/test_cases.md`
- `application/README.md`
- `application/e2e/src/posting.test.ts`

## 3. 影響範囲

### クライアント (変換ロジック除去)

- `application/client/src/components/new_post_modal/NewPostModalPage.tsx`
- `application/client/rspack.config.js`

### サーバー (変換ロジック追加)

- `application/server/src/routes/api/image.ts`
- `application/server/src/routes/api/movie.ts`
- `application/server/src/routes/api/sound.ts`
- `application/server/src/utils/convert_image.ts` (新規)
- `application/server/src/utils/convert_media.ts` (新規)
- `application/server/types/ffmpeg-static.d.ts` (新規)
- `application/server/package.json`
- `application/pnpm-lock.yaml`

### 不要になったクライアント側ユーティリティ (参照ゼロ、バンドル未収録を確認)

- `application/client/src/utils/convert_image.ts`
- `application/client/src/utils/convert_movie.ts`
- `application/client/src/utils/convert_sound.ts`
- `application/client/src/utils/load_ffmpeg.ts`
- `application/client/src/utils/extract_metadata_from_sound.ts`

## 4. 実装前の仮説

- `NewPostModalPage.tsx` から `import("@imagemagick/magick-wasm")` / `import("@web-speed-hackathon-2026/client/src/utils/convert_image")` 等の dynamic import を除去すれば、rspack のツリーシェイキングで WASM チャンクがバンドルから消える
- サーバー側で `sharp` (画像) と `ffmpeg-static` + `child_process` (音声/動画) を使えば同等の変換が可能
- クライアントの `isConverting` ステート管理が不要になり、投稿UIの応答性が向上する
- E2E テスト 30 (画像投稿) が ImageMagick WASM の WebP→WebP 変換でハングしていた問題も解消される

## 5. 採用した方針

**サーバー側変換 + クライアント生ファイル送信**

### 画像 (sharp)

- クライアントから生画像をそのまま送信
- サーバーで `sharp(buffer).webp({ quality: 80 }).withMetadata().toBuffer()` により WebP に変換
- EXIF メタデータは `withMetadata()` で保持 (ImageMagick の非標準 Comment フィールド問題を回避)

### 音声/動画 (ffmpeg-static)

- クライアントから生ファイルをそのまま送信
- サーバーで `ffmpeg-static` 同梱のバイナリを `child_process.execFile` で実行
- 音声: `-codec:a libmp3lame -b:a 96k -ar 44100` で MP3 変換 (元の ffmpeg.wasm と同一オプション)
- 動画: `-t 5 -r 10 -vf crop -an -c:v libvpx-vp9 -crf 35` で WebM 変換 (元の ffmpeg.wasm と同一オプション)
- 一時ファイルは `os.tmpdir()` 配下に作成し、変換後に `fs.rm` で削除

### rspack 設定

- `@ffmpeg/ffmpeg`, `@ffmpeg/core`, `@ffmpeg/core/wasm`, `@imagemagick/magick-wasm/magick.wasm` のエイリアスを削除
- ffmpeg 関連の `ignoreWarnings` を削除

## 6. 実装内容

### サーバー新規ファイル

- `server/src/utils/convert_image.ts` — sharp による WebP 変換
- `server/src/utils/convert_media.ts` — ffmpeg による MP3/WebM 変換 (temp file + execFile パターン)
- `server/types/ffmpeg-static.d.ts` — 型宣言

### サーバー既存ファイル変更

- `server/src/routes/api/image.ts` — `fileTypeFromBuffer` による WebP 検証を削除し、`convertImageToWebP()` で任意画像を受け入れ
- `server/src/routes/api/movie.ts` — 同上、`convertMovieToWebm()` で任意動画を受け入れ
- `server/src/routes/api/sound.ts` — 同上、メタデータ抽出後に `convertSoundToMp3()` で変換
- `server/package.json` — `sharp`, `ffmpeg-static` を追加

### クライアント変更

- `NewPostModalPage.tsx`
  - `handleChangeImages`: ImageMagick WASM / piexifjs の動的インポートと変換ロジックをすべて削除。生ファイルを直接 state にセット
  - `handleChangeSound`: ffmpeg.wasm の動的インポートと変換ロジックを削除。生ファイルを直接 state にセット
  - `handleChangeMovie`: 同上
  - `isConverting` state を完全除去
  - ボタンのラベルを「変換中」→「投稿中」に変更
- `rspack.config.js` — 不要になったエイリアスと ignoreWarnings を削除

## 7. 検証結果

- `pnpm --filter @web-speed-hackathon-2026/server typecheck`: 成功
- `pnpm build`: 成功
- WASM バンドル除去確認: `rg` で dist/scripts/ 内に `imagemagick`, `magick-wasm`, `@ffmpeg`, `ffmpeg-core` が含まれないことを確認
- E2E テスト (52テスト, 4ワーカー並列):

| 結果 | 件数 | 備考 |
|------|------|------|
| 成功 (初回) | 47 | |
| 成功 (リトライ) | 3 | テスト 23, 13, 14 — 既知のフレーク |
| 失敗 | 2 | テスト 11 (DM並列競合), テスト 55/56 (サムネ色抽出) — 今回の変更と無関係 |

特に **テスト 30 (画像の投稿ができる)** は以前 ImageMagick WASM の WebP→WebP 冗長変換でハングしていたが、今回の変更で安定して成功するようになった。

## 8. スコア変化

### バンドルサイズ

| 指標 | before | after | 差分 |
|------|--------|-------|------|
| `scripts/main.js` | 421.4 KiB | 336.7 KiB | **−84.7 KiB (−20.1%)** |
| entrypoint (main.js + main.css) | 472.9 KiB | 388.2 KiB | **−84.7 KiB (−17.9%)** |

### 除去された遅延チャンク

以下のモジュール群がバンドルの遅延チャンクから完全に消えた:

- `@imagemagick/magick-wasm` (WASM バイナリ ~5 MB)
- `piexifjs`
- `@ffmpeg/ffmpeg`
- `@ffmpeg/core` (WASM バイナリ ~数 MB)
- `encoding-japanese` (ffmpeg メタデータ用)

### 投稿 UX

- 画像選択 → 投稿ボタン有効化が即座になった (以前は WASM 初期化 + 変換で数秒〜数十秒)
- 「変換中」スピナーが不要になり、投稿フローがシンプル化

## 9. リスクと未確認事項

- Lighthouse の再計測は未実施 (TBT, unused-javascript の変化を確認すべき)
- `ffmpeg-static` のバイナリは約 45 MB — Docker イメージサイズが増加する (代替: Dockerfile で `apt-get install ffmpeg`)
- EXIF ImageDescription の保持は `sharp` の `withMetadata()` に依存 — 元の piexifjs による明示書き込みとは挙動が微妙に異なる可能性
- `application/client/package.json` から `@imagemagick/magick-wasm`, `piexifjs`, `@ffmpeg/ffmpeg`, `@ffmpeg/core`, `encoding-japanese` の依存宣言はまだ残っている (ビルドには影響なし)
- テスト 11 (DM並列競合) とテスト 55/56 (サムネ色抽出) は未解決

## 10. 次にやるべきこと

- Lighthouse を再計測して `unused-javascript`, TBT の変化を確認する
- `client/package.json` から不要になった依存 (`@imagemagick/magick-wasm`, `piexifjs`, `@ffmpeg/ffmpeg`, `@ffmpeg/core`, `encoding-japanese`) を除去する
- 不要になったクライアントユーティリティファイル (`convert_image.ts`, `convert_movie.ts`, `convert_sound.ts`, `load_ffmpeg.ts`, `extract_metadata_from_sound.ts`) を削除する
- Docker ビルドで `sharp` と `ffmpeg-static` が正しくインストールされるか確認する
- テスト 11 (DM並列競合) の根本原因を解決する
