# 037-FFmpeg・ImageMagick WASMをクライアントから完全除去する

## 概要

クライアントバンドルのFFmpeg WASM（31MB）とImageMagick WASMを完全除去し、音声フォーマット変換をサーバーサイドに移行する。

## 方針

- サーバー側sound.tsにffmpegによる音声変換を追加（movie.tsと同パターン）
- クライアント側のconvertSound呼び出しを除去し、生ファイルをサーバーに送信
- 不要なユーティリティファイル・依存パッケージ・webpack設定を削除

## 変更が必要な箇所

### サーバー側
- `application/server/src/routes/api/sound.ts` — ffmpegによる音声変換追加

### クライアント側
- `application/client/src/components/new_post_modal/NewPostModalPage.tsx` — convertSound除去
- `application/client/src/utils/convert_sound.ts` — 削除
- `application/client/src/utils/convert_movie.ts` — 削除（未使用）
- `application/client/src/utils/convert_image.ts` — 削除（未使用）
- `application/client/src/utils/load_ffmpeg.ts` — 削除（未使用）
- `application/client/src/utils/extract_metadata_from_sound.ts` — 削除（未使用）
- `application/client/package.json` — 依存削除
- `application/client/webpack.config.js` — alias/ignoreWarnings削除

## 注意事項

- サーバー環境にffmpeg CLIが必要（Fly.ioイメージに含まれている前提、movie.tsで既に使用中）
- extractMetadataFromSoundはサーバー側に既存実装あり（music-metadata使用）
