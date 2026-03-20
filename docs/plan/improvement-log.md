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
