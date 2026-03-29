| # | 改善内容 | Before | After | 差分 | 採用 | 備考 |
|---|---------|--------|-------|------|------|------|
| 1 | T01: webpack `mode=production` + `minimize=true` + `devtool=false` + `NODE_ENV=production` | 未計測 | 未計測 | 未計測 | PENDING | 依存インストールが `EAI_AGAIN`（registry 到達不可）で失敗。計測環境復旧後に再計測予定 |
| 2 | T02: `splitChunks` + tree-shaking 系最適化 + ルート lazy import | 未計測 | 未計測 | 未計測 | PENDING | ビルド未実行（ユーザー指示） |
| 3 | T03: Babel ターゲットを `chrome 130` へ変更 | 未計測 | 未計測 | 未計測 | PENDING | ビルド未実行（ユーザー指示） |
| 4 | T04: 静的動画を `GIF -> MP4` に変換し配信拡張子を変更 | 未計測 | 未計測 | 未計測 | PENDING | ビルド未実行（ユーザー指示） |
| 5 | T05: 静的画像を `JPG -> WebP` に変換し配信拡張子を変更 | 未計測 | 未計測 | 未計測 | PENDING | ビルド未実行（ユーザー指示） |
| 6 | T06: Tailwind CDN を除去し PostCSS ビルドタイム適用へ移行 | 未計測 | 未計測 | 未計測 | PENDING | ビルド未実行（ユーザー指示） |
| 7 | T07: `jQuery/bluebird/pako` 除去 + `fetch` ベースへ置換 | 未計測 | 未計測 | 未計測 | PENDING | ビルド未実行（ユーザー指示） |
| 8 | T08: FFmpeg/ImageMagick の読み込みを遅延化（動的 import） | 未計測 | 未計測 | 未計測 | PENDING | ビルド未実行（ユーザー指示） |
| 9 | T09: `moment` を `Intl` ベース実装へ置換 | 未計測 | 未計測 | 未計測 | PENDING | ビルド未実行（ユーザー指示） |
| 10 | T10: `lodash` 利用箇所をネイティブ JS に置換 | 未計測 | 未計測 | 未計測 | PENDING | ビルド未実行（ユーザー指示） |
| 11 | P1-01: `asset/bytes` -> `asset/resource` へ変更（WASM分離） | 未計測 | 未計測 | 未計測 | PENDING | ビルド未実行（ユーザー指示） |
| 12 | P1-02: Babel `modules:false` + React preset `development:false` | 未計測 | 未計測 | 未計測 | PENDING | ビルド未実行（ユーザー指示） |
| 13 | P1-03: `NewPostModalContainer` の lazy load 化 | 未計測 | 未計測 | 未計測 | PENDING | ビルド未実行（ユーザー指示） |
| 14 | P1-04: `CoveredImage` の `image-size/piexifjs` 動的 import 化 | 未計測 | 未計測 | 未計測 | PENDING | ビルド未実行（ユーザー指示） |
| 15 | P2-01: `compression` ミドルウェア追加 | 未計測 | 29.85/100 (ホーム) | N/A | ADOPT | ホーム画面限定計測で問題なく完走 |
| 16 | P2-02: API no-cache 限定 + 静的配信 `etag/lastModified` + fingerprinted asset 長期キャッシュ | 未計測 | 29.85/100 (ホーム) | N/A | ADOPT | ホーム画面限定計測で問題なく完走 |
| 17 | P2-03: 初期描画を即時実行（`window.load` 待ちなし） | 未計測 | 29.85/100 (ホーム) | N/A | ADOPT | 既適用済みを確認、同一条件で採用 |
| 18 | P3-05: `AuthModalContainer` の lazy load 化 | 29.85/100 (ホーム) | 29.85/100 (ホーム) | 0.00 | ADOPT | スコア同値だが `main` エントリバンドル縮小（約372KiB→321KiB） |
| 19 | #1 CoveredImage 直接 `<img src>` 化 | 29.85/100 (ホーム) | 30.05/100 (ホーム) | +0.20 | ADOPT | blob URL / EXIF再読込 / 二重ダウンロードを削除 |
| 20 | #2 InfiniteScroll の 2^18 ループ除去 | 30.05/100 (ホーム) | 30.35/100 (ホーム) | +0.30 | ADOPT | スクロール判定を1式へ簡素化、イベントを passive 化 |
| 21 | #3 検索フローの見出し文言修正 | 30.35/100 (ホーム) | 30.35/100 (ホーム) | 0.00 | ADOPT | 機能修正。初回計測の急落は再計測で再現せず外乱と判断 |
| 22 | #4 フォント最適化（利用規約用フォント分離案） | 30.35/100 (ホーム) | 30.35/100 (ホーム) | 0.00 | CANCEL | ホーム指標に改善なし。WOFF2サブセット変換は別途ツール準備後に再実施 |
| 23 | #5 サーバーキャッシュヘッダー再調整 | 30.35/100 (ホーム) | 30.15/100 (ホーム) | -0.20 | CANCEL | ホーム計測で悪化のため採用見送り（既存Phase2実装を維持） |
