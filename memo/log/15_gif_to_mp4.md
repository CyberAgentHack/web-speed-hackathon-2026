# 15. GIF → MP4 変換 (2026-03-20)

## 変更内容

GIF 動画を MP4 (H.264) に変換し、`<canvas>` + omggif/gifler による JS デコードを `<video>` タグによるブラウザネイティブ再生に置き換え。

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/components/foundation/PausableMovie.tsx` | omggif/gifler/canvas 全廃止 → `<video autoPlay loop muted playsInline preload="metadata">` に置き換え |
| `client/src/utils/get_path.ts` | `getMoviePath()`: `.gif` → `.mp4` |
| `client/src/components/new_post_modal/NewPostModalPage.tsx` | 新規投稿の動画変換出力を `gif` → `mp4` に変更 |
| `server/src/routes/api/movie.ts` | アップロード時に GIF を ffmpeg で MP4 に変換して保存 |
| `public/movies/*.mp4` | 既存15本の GIF を MP4 に事前変換 |
| `e2e/src/home.test.ts` | `canvas` → `video` チェックに変更 |
| `e2e/src/post-detail.test.ts` | `canvas` → `video` チェックに変更、VRTスナップショット更新 |

## 効果

- **ファイルサイズ**: 180MB (GIF) → 27MB (MP4, CRF 28) — **85% 削減**
- **デコード**: JS (omggif/gifler) → ブラウザ HW デコード — CPU 負荷大幅軽減
- **表示速度**: 全バイナリ DL 完了まで null → video が即座にレンダリング開始
- **ストリーミング**: preload="metadata" で必要部分だけ取得可能

## VRT 結果

- 動画関連テスト: 全て合格
  - `ホーム › 動画が自動再生される`
  - `投稿詳細 - 動画 › 動画が自動再生され、クリックで一時停止・再生を切り替えられる`
  - `ホーム › タイムラインが表示される` (VRTスクリーンショット含む)
  - `レスポンシブ › スマホ/デスクトップ表示`
- 失敗6件は既存の問題 (DM, 検索, 投稿) で本変更とは無関係

## 前回との比較

- log 13 計測時: fetch(GIF/MP3) 13件 ~90MB のうち GIF が ~76MB
- log 14 (MP3 ストリーミング): MP3 ~67MB 削減
- 本変更: GIF 180MB → MP4 27MB (85% 削減)
- 累計: 初期ロードの GIF+MP3 転送量が ~250MB → ~27MB
