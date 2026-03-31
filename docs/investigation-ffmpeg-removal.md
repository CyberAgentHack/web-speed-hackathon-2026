# FFmpeg 削除調査レポート

## 概要

クライアント側で `@ffmpeg/ffmpeg` + `@ffmpeg/core`（WASM版FFmpeg、数十MB）を使用しており、バンドルサイズを大幅に圧迫している。投稿作成時のメディア変換にのみ使われているため、サーバー側のバリデーション緩和と表示コンポーネントの変更により完全に削除可能。

---

## 現状の処理フロー

```
投稿モーダル（NewPostModalPage.tsx）
├─ 画像添付 → ImageMagick WASM で JPEG 変換 → /api/v1/images
├─ 動画添付 → ffmpeg で GIF 変換 → /api/v1/movies → gifler で Canvas 再生
└─ 音声添付 → ffmpeg で MP3 変換 + メタデータ抽出 → /api/v1/sounds → <audio> で再生
```

### ffmpeg の使用箇所（4ファイル）

| ファイル | 処理内容 |
|----------|----------|
| `client/src/utils/load_ffmpeg.ts` | WASM版ffmpegの初期化 |
| `client/src/utils/convert_movie.ts` | 動画→GIF変換（先頭5秒・10fps・正方形クロップ・無音） |
| `client/src/utils/convert_sound.ts` | 音声→MP3変換 + メタデータ付与 |
| `client/src/utils/extract_metadata_from_sound.ts` | ffmetadata形式でアーティスト名・曲名を抽出 |

### サーバー側のバリデーション

- **movie.ts**: `fileTypeFromBuffer` で GIF のみ許可。`uploads/movies/{uuid}.gif` に保存
- **sound.ts**: `fileTypeFromBuffer` で MP3 のみ許可。`uploads/sounds/{uuid}.mp3` に保存。`extractMetadataFromSound` でメタデータ抽出（`music-metadata` 使用）

### 表示コンポーネント

- **PausableMovie.tsx**: `gifler` ライブラリでGIFをデコードし、Canvas上に描画。クリックで再生/一時停止。GIF専用
- **SoundPlayer.tsx**: `fetchBinary` でMP3をダウンロード → Blob URL化 → HTML5 `<audio>` で再生

---

## 変更方針

**サーバーが生ファイル（mp4/webm/wav等）をそのまま受け付けるように変更し、クライアント側の変換処理を完全に削除する。**

### 変更対象ファイル

#### 削除するファイル
| ファイル | 理由 |
|----------|------|
| `client/src/utils/load_ffmpeg.ts` | ffmpeg初期化、不要に |
| `client/src/utils/convert_movie.ts` | GIF変換、不要に |
| `client/src/utils/convert_sound.ts` | MP3変換、不要に |
| `client/src/utils/extract_metadata_from_sound.ts` | メタデータ抽出、サーバー側で対応済み |

#### クライアント側の修正
| ファイル | 変更内容 |
|----------|----------|
| `NewPostModalPage.tsx` | ffmpeg変換呼び出しを削除し、生ファイルをそのまま渡す |
| `PausableMovie.tsx` | gifler + Canvas → `<video muted autoplay loop playsinline>` に置換 |
| `SoundPlayer.tsx` | Blob URL経由ではなくURLを直接 `<audio>` に渡す（変更があれば） |
| `get_path.ts` | 動画パスの拡張子を固定値からサーバーレスポンスに合わせる |

#### サーバー側の修正
| ファイル | 変更内容 |
|----------|----------|
| `server/src/routes/api/movie.ts` | GIF限定バリデーションを緩和し、動画形式（mp4/webm/gif等）を許可。拡張子をfileTypeから取得 |
| `server/src/routes/api/sound.ts` | MP3限定バリデーションを緩和し、音声形式（mp3/wav/ogg/m4a等）を許可。拡張子をfileTypeから取得 |
| `Movie` モデル | ファイル拡張子カラムを追加（パス解決に必要） |
| `Sound` モデル | ファイル拡張子カラムを追加（パス解決に必要） |

#### 削除するパッケージ
| パッケージ | サイズ影響 |
|------------|-----------|
| `@ffmpeg/ffmpeg` | ffmpegライブラリ本体 |
| `@ffmpeg/core` | WASM バイナリ（数十MB） |
| `gifler` | GIFデコード・再生 |
| `omggif` | GIFパーサー（giflerの依存） |
| `encoding-japanese` | メタデータの文字コード変換 |
| `@types/omggif` | 型定義 |
| `@types/encoding-japanese` | 型定義 |

#### webpack設定の整理
| 項目 | 変更内容 |
|------|----------|
| `alias` | `@ffmpeg/ffmpeg`, `@ffmpeg/core`, `@ffmpeg/core/wasm` のエイリアス削除 |
| `ignoreWarnings` | `@ffmpeg` の警告無視設定を削除 |
| `asset/bytes` ルール | ffmpeg用のバイナリローダー設定を削除（他に使用箇所がなければ） |

---

## パス解決の課題

現在 `get_path.ts` で拡張子がハードコードされている:
```typescript
// 現状: /movies/{id}.gif 固定
// 変更後: /movies/{id}.mp4 など可変
```

**解決策**: Movie/Sound モデルに `extension` カラムを追加し、クライアントにはレスポンスで拡張子も返す。
