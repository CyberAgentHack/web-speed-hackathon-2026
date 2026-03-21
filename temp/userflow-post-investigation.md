# ユーザーフロー: 投稿 — 調査・改善記録

## ステータス: 未解決（一旦保留）

## エラー内容
```
ユーザーフロー: 投稿 | 音声投稿の完了を確認できませんでした
```

## scoring-toolの投稿フロー
1. サインイン（ユーザー: o6yq16leo）
2. テキスト投稿
3. 画像投稿（TIFF 2.4MB → サーバーでAVIF変換）
4. 動画投稿（MKV 4.2MB → サーバーでWebM/VP9変換）
5. 音声投稿（WAV → サーバーでMP3変換）
6. 音声投稿後、article内に「シャイニングスター」「魔王魂」の表示を確認（120秒タイムアウト）

## 実施した改善

### コミット一覧
- `1234f7a` — aria-label追加、パスワード正規表現最適化、Input type変更
- `dcbc9ed` — WAVファイル軽量化（9.8MB → 1.2MB, mono/22050Hz/8bit）
- `9681085` — ffmpeg 2回→1回統合、MP3 64kbps、fs.rename、並列送信、SoundPlayer二重IntersectionObserver解消
- `c5f006d` — SoundWaveSVGモノラル対応（getChannelDataエラー修正）

### 詳細
| 改善 | 対象 | 内容 |
|------|------|------|
| ffmpeg統合 | サーバー sound.ts | メタデータ抽出+MP3変換を1回のffmpegで同時実行 |
| MP3ビットレート | サーバー sound.ts | 64kbps指定でエンコード高速化 |
| ファイルI/O削減 | サーバー sound.ts | fs.readFile+writeFile → fs.rename |
| 並列送信 | クライアント NewPostModalContainer.tsx | 画像・動画・音声をPromise.allで並列化 |
| IntersectionObserver | クライアント SoundPlayer.tsx | 二重IntersectionObserver解消、title/artist即時表示 |
| モノラル対応 | クライアント SoundWaveSVG.tsx | getChannelData(1)のIndexSizeError修正 |
| WAV軽量化 | docs/assets | 9.8MB → 1.2MB（ただしscoring-toolは別リポジトリのWAVを使用） |

## 検証結果

### ローカル（macOS）
- 4連続投稿: 約17秒で全て成功
- 音声単独投稿: 約1.3秒で成功

### デプロイ環境（Fly.io pr-97）Playwright手動テスト
- 4連続投稿: 約17秒で全て成功（テキスト465ms → 画像1.5s → 動画15.5s → 音声16.7s）
- 音声単独投稿: 約1.1秒で成功
- 「シャイニングスター」「魔王魂」の表示確認済み

### デプロイ環境 API直接テスト（curl）
- 1.2MB WAV: 0.53秒で成功（title/artist正しく返る）
- 9.8MB WAV: 17.3秒で成功（title/artist正しく返る）

### scoring-tool（リモートスコアリング）
- **計測できません**（音声投稿の完了を確認できませんでした）

## 未解決の原因候補

### 1. scoring-toolが使うWAVファイルのサイズ
- scoring-toolは別リポジトリ（CyberAgentHack/web-speed-hackathon-2026-scoring）
- そのリポジトリの `docs/assets/maoudamashii_shining_star.wav` は**元の9.8MB**のまま
- 9.8MB WAVのサーバー処理: 約17秒
- 我々のリポジトリで軽量化しても、scoring-toolには影響しない

### 2. scoring-tool環境のネットワーク・タイミング
- scoring-toolはGitHub Actions等で実行される
- ブラウザ→Fly.ioへの9.8MBアップロード時間
- 4連続投稿（特に動画VP9変換）の合計時間が120秒を超える可能性
- Fly.io shared-cpu-1x でのCPUスロットリング

### 3. セッション管理
- `/api/v1/initialize`がsessionStore.clear()を呼ぶ
- Fly.ioのMemoryStoreでセッションが不安定になる可能性
- 4連続投稿中にセッションが失われる可能性

### 4. scoring-toolのPlaywrightバージョン差異
- scoring-toolのPlaywrightと我々のテスト環境のバージョンが異なる可能性
- pressSequentiallyの挙動差異

## 今後の改善案（もし再挑戦する場合）

1. **サーバー側でWAVの事前サンプリングレート変換**（受信時に即座にダウンサンプル→ffmpegに渡す）
2. **ffmpegの-preset fastオプション**（MP3エンコーダには直接適用不可だが、libmp3lameのquality設定）
3. **bodyParser.rawのストリーミング化**（メモリバッファリングを避ける）
4. **動画変換の高速化**（VP9のCRF値を上げる、libvpx-vp9→libx264に変更等）
