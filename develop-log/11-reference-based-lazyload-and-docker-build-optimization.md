# 11 Reference Based Lazyload and Docker Build Optimization

## 背景

- 初期表示とデプロイ時間の両方を追加改善する。
- 既存の「ビルド＆デプロイが重い」課題に対し、再ビルド時のキャッシュヒット率と転送量をさらに改善する。

## 実施内容

### 1. フロントエンドの初期ロード削減

- ルート単位の遅延読み込みを導入
  - `AppContainer` 内の主要コンテナを `React.lazy` + `Suspense` へ置換。
  - 初回に不要なルートコードをロードしない構成に変更。
- 重いユーティリティの遅延読み込みを導入
  - 翻訳処理 (`create_translator`) をクリック時の dynamic import に変更。
  - 投稿モーダルのメディア変換 (`convert_image`, `convert_movie`, `convert_sound`) を dynamic import 化。

### 2. バンドル肥大の抑制

- `?binary` を `asset/bytes` から `asset/resource` に変更し、JS への巨大バイナリ埋め込みを解消。
- `splitChunks` を有効化し、`react-vendor` / `vendor` / `main` に分離。
- `HtmlWebpackPlugin` を `inject: true` + `scriptLoading: "defer"` に統一。

### 3. 先読み・キャッシュの改善

- `index.html` で `window.__PREFETCH__` を使った初期 API 先読みを追加（`/api/v1/posts`, `/api/v1/me`）。
- `fetchJSON` 側で `__PREFETCH__` を優先利用するよう変更。
- 静的配信の `Cache-Control` を改善
  - `public`, `upload`, `dist` は `immutable + maxAge=1y`
  - `html` のみ `no-cache` に分離

### 4. Docker ビルド／デプロイ短縮向けの再設計

- `.dockerignore` を強化し、不要コンテキスト（`.ref-*`, cache類など）を除外。
- Dockerfile を段階分離
  - `pnpm fetch`（一度だけ）→ `offline install`（client/server別）へ変更。
  - `public-assets` ステージを分離し、巨大静的資産のキャッシュ再利用を改善。
  - runtime には必要ファイルのみをコピーし、server ソース更新時に巨大ファイル再転送を起こしにくい構成へ変更。
  - `server/node_modules`（workspaceリンク）を明示コピーし、起動失敗を解消。

## 変更ファイル

- `.dockerignore`
- `Dockerfile`
- `application/client/webpack.config.js`
- `application/client/types/webpack.d.ts`
- `application/client/src/containers/AppContainer.tsx`
- `application/client/src/components/post/TranslatableText.tsx`
- `application/client/src/components/new_post_modal/NewPostModalPage.tsx`
- `application/client/src/utils/load_ffmpeg.ts`
- `application/client/src/utils/convert_image.ts`
- `application/client/src/index.html`
- `application/client/src/utils/fetchers.ts`
- `application/server/src/routes/static.ts`

## 検証

- `pnpm --dir application run build`
- `pnpm --dir application/client exec tsc --noEmit`
- `pnpm --dir application/server exec tsc --noEmit`
- `pnpm --dir application/e2e exec tsc --noEmit`
- `docker build --target runtime -f Dockerfile .`
- `docker build --target runtime -f Dockerfile -t wsh-runtime-test .`
- `docker run -d --name wsh-runtime-test-c2 -p 18080:3000 wsh-runtime-test`
- `Invoke-WebRequest http://127.0.0.1:18080/` で `200` を確認

## 備考

- 方針に従い、`scoring-tool` による採点計測は未実施。
