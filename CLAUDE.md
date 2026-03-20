# Web Speed Hackathon 2026 - CaX

架空のSNSサイト「CaX」のパフォーマンスを改善する競技。

## 技術スタック

- **クライアント**: React 19 + Redux + React Router 7 + jQuery + PostCSS
- **バンドラー**: Webpack 5 (Babel)
- **CSS**: Tailwind CSS v4 **ブラウザ版** (CDN: `@tailwindcss/browser@4.2.1`) — ランタイムコンパイル
- **サーバー**: Express 5 + Sequelize 6 + SQLite3 + WebSocket
- **パッケージマネージャー**: pnpm 10 (workspaces)

## ディレクトリ構成

```
application/
  client/                    # フロントエンド
    src/index.tsx            # React エントリーポイント (#app)
    src/index.html           # HTMLテンプレート (Tailwind CDN読み込み)
    src/index.css            # Webpackエントリー (CSS)
    webpack.config.js        # Webpack設定
  server/
    src/index.ts             # サーバー起動 (port 3000)
    src/app.ts               # Express設定
    seeds/                   # シードデータ (JSONL)
    database.sqlite          # SQLite DB (~94MB)
  e2e/                       # Playwright VRT
  dist/                      # ビルド出力
  public/                    # 静的ファイル
scoring-tool/                # Lighthouseベースの採点ツール
docs/                        # レギュレーション・採点方法
```

## コマンド

```bash
# ビルド & 起動 (portless経由、ドメイン名は issue+issue番号)
cd application && pnpm run build
portless proxy start
portless issue2 pnpm run start   # → http://issue2.localhost:1355

# VRT (Visual Regression Test)
cd application/e2e && pnpm run test          # 実行
cd application/e2e && pnpm run test:update   # スナップショット更新

# スコア計測 (portless URL を指定)
cd scoring-tool && pnpm start --applicationUrl http://issue2.localhost:1355

# DB初期化
curl -X POST http://issue2.localhost:1355/api/v1/initialize

# 型チェック・フォーマット
cd application && pnpm run typecheck
cd application && pnpm run format
```

## レギュレーション (重要)

- VRT・手動テスト項目を壊す変更は **レギュレーション違反** (失格)
- シードデータのID変更禁止
- `GET /api/v1/crok` のSSEプロトコル変更禁止
- `POST /api/v1/initialize` でDB初期化できること必須
- コード・ファイルは全て変更可、外部SaaS利用可

## チケット管理

https://github.com/KenyaMasuko/web-speed-hackathon-2026/issues

## 採点 (1150点満点)

**ページの表示** (9ページ × 100点 = 900点):
- FCP×10, SI×10, **LCP×25**, **TBT×30**, **CLS×25**

**ページの操作** (5シナリオ × 50点 = 250点, 表示300点以上で採点):
- TBT×25, INP×25
