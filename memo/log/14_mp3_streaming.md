# 14. MP3 ストリーミング化 (2026-03-20)

## 変更内容

MP3 音声の配信方式を fetch→ArrayBuffer→Blob URL から `<audio src=... preload="none">` 直接配信に変更。
波形描画用のピークデータはサーバーサイドで事前計算し、小さな JSON ファイルとして配信するように変更。

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `client/src/components/foundation/SoundPlayer.tsx` | fetch+Blob URL廃止 → `<audio src=... preload="none">` 直接指定、ピークJSON取得に変更 |
| `client/src/components/foundation/SoundWaveSVG.tsx` | `decodeAudioData` 廃止 → プリコンピュートされた peaks/max を props で受け取り |
| `client/src/utils/get_path.ts` | `getSoundPeaksPath()` 追加 |
| `server/src/routes/api/sound.ts` | アップロード時に ffmpeg でピークデータを生成・保存 |
| `public/sounds/*.peaks.json` | 既存15曲分のピークデータ (各約4KB、合計約60KB) |

## 想定効果

- 初期ロードから ~67MB の MP3 ダウンロードを完全に排除
- 代わりに ~4KB/曲のピーク JSON のみ取得 (合計約60KB)
- `preload="none"` により再生ボタン押下までブラウザはMP3をダウンロードしない
- ブラウザの Range Request / ストリーミング再生が有効になる
- `AudioContext.decodeAudioData()` のクライアントサイド計算コストも排除

## VRT 結果

- 音声関連テスト: 全て合格
  - `ホーム › 音声の波形が表示される`
  - `投稿詳細 - 音声 › 音声の波形が表示され、再生ボタンで切り替えられる`
  - `ホーム › タイムラインが表示される` (VRTスクリーンショット含む)
  - `レスポンシブ › スマホ/デスクトップ表示`
- 失敗6件は既存の問題 (DMログインタイムアウト、検索機能) で本変更とは無関係

## 前回との比較

- log 13 計測時: fetch(GIF/MP3) 13件 ~90MB のうち MP3 が ~16MB
- 本変更後: 初期ロードの MP3 転送は 0MB (ピークJSONのみ ~60KB)
