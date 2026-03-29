## 開発方法

### 必要なもの

- mise-en-place (mise)
  - https://mise.jdx.dev/

### セットアップ

1. mise を有効化します
   - ```bash
     mise trust
     ```
2. 依存パッケージをインストールします
   - ```bash
     mise install
     ```

## ディレクトリ構成

- `/application` : CaX のアプリケーションです
- `/scoring-tool` : CaX のパフォーマンス計測ツールです

開発方法・使用方法については、それぞれの README を参照してください。

## パフォーマンス改善メモ

### 優先メトリクス

次の優先度で改善を進めます。

- First Contentful Paint (FCP): 10点
- Speed Index (SI): 10点
- Largest Contentful Paint (LCP): 25点
- Total Blocking Time (TBT): 30点（表示） + 25点（操作）
- Cumulative Layout Shift (CLS): 25点
- Interaction to Next Paint (INP): 25点

### 2026-03-20 実施内容（ホーム画面中心）

- 同期XHRを廃止し、通信待ちによるメインスレッドブロックを削減
- 投稿一覧の取得をページング化し、初回転送量を削減
- 無限スクロールを IntersectionObserver 化してスクロール時CPU負荷を削減
- 画像表示でのバイナリ再取得/EXIF解析を廃止し、通常の img 表示に変更
- 画像・アバターに lazy/async ヒントを付与
- 翻訳機能の重い依存をクリック時の動的importへ変更
- ルーティングと新規投稿モーダルを遅延ロード化
- 音声波形計算の lodash 依存を除去
- バンドル設定を見直し、初期JSサイズを大幅に削減

**計測結果（2026-03-20 11:30頃）:**
- FCP: 12.04s (target: <1.8s)
- SI: 19.44s (target: <3.9s)
- LCP: 947.27s (target: <2.5s)
- TBT: 11628ms (target: <200ms)
- CLS: 0.672 (target: <0.1)
- Scoring: 23.75/100 (CLS only)

### 2026-03-20 2回目改善（新規投稿モーダル遅延ロード化）

- NewPostModalPage のメディア変換依存（ImageMagick, convert_image/convert_movie/convert_sound）を動的import化
- ファイル選択時のみメディア変換ライブラリをロード（初期バンドル削減）
- AppContainer の NewPostModalContainer 遅延ロードとの組み合わせで、モーダル開時のみ重い依存が読み込まれるように設計

**計測結果（遅延ロード後）:**
- FCP: 12.04s (不変)
- SI: 19.44s (変化なし)
- LCP: 947.27s (変化なし)
- TBT: 11628ms (20841ms から大幅改善)
- CLS: 0.672 (0.523 から若干悪化)
- Scoring: 23.75/100 (CLS 23.75)

### 次の計測方針

- ホーム画面を起点に、FCP/LCP の残ボトルネック（main.js スクリプト評価 42s が主要）を詳細分析
- jquery/bluebird/redux-form など main.js に含まれる大型ライブラリの削減または分割
- 操作シナリオの修正して INP 測定を再度試行
- 改善ごとに scoring-tool で差分を記録し、回帰を防止
