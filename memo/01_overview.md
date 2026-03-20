# プロジェクト全体概要

## 概要
架空のSNS「CaX」のパフォーマンスを改善するWeb Speed Hackathon 2026の課題リポジトリ。

## 技術スタック
- **フロントエンド**: React 19 + Redux + React Router 7 + Webpack 5
- **バックエンド**: Express 5 + Sequelize 6 + SQLite3
- **言語**: TypeScript (tsx で直接実行)
- **パッケージ管理**: pnpm 10.32.1 (workspaces)
- **Node.js**: 24.14.0
- **デプロイ**: Fly.io (Docker)

## ディレクトリ構成
```
/
├── application/
│   ├── client/          # React SPA (Webpack 5)
│   ├── server/          # Express API + 静的配信
│   ├── e2e/             # Playwright VRT
│   └── public/          # 静的アセット (~370MB)
│       ├── movies/      # GIF (180MB, 15個)
│       ├── images/      # JPG (90MB, 60個)
│       ├── sounds/      # MP3 (67MB, 15個)
│       ├── dicts/       # kuromoji辞書 (18MB)
│       └── fonts/       # OTFフォント (13MB, 2個)
├── scoring-tool/        # Lighthouse採点ツール
├── docs/                # ドキュメント
├── Dockerfile           # マルチステージビルド
├── fly.toml             # Fly.io設定 (変更禁止)
└── mise.toml            # ツールチェーン管理
```

## 採点 (1150点満点)
- ページの表示 (900点): 9ページ x FCP/SI/LCP/TBT/CLS
- ページの操作 (250点): 5シナリオ x TBT/INP (表示300点以上で採点)

## 主なレギュレーション
- VRT・手動テストが通ること
- fly.toml 変更禁止
- SSE プロトコル変更禁止
- POST /api/v1/initialize でDB初期化できること
- コード・ファイルは自由に変更可
