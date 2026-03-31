# Web Speed Hackathon 2026 — CLAUDE.md

## プロジェクト概要

SNS アプリ「CaX」のパフォーマンス改善競技。Lighthouse スコアを最大化する。

- **採点**: 1150点満点（ページ表示 900点 + ページ操作 250点）
- **採点ツール**: Lighthouse v10 Performance Scoring
- **デプロイ先**: Fly.io（GitHub Actions 経由）

---

## ⚠️ レギュレーション違反に注意

以下は違反すると**順位対象外**になる。変更前に必ず確認すること。

### 絶対に変更してはいけないもの

| 対象 | 理由 |
|------|------|
| `fly.toml` | Fly.io デプロイ設定。変更禁止 |
| `GET /api/v1/crok` の SSE プロトコル | ストリーミング仕様変更禁止 |
| `crok-response.md` と同等画面の構成情報 | SSE 以外での伝達禁止 |
| シードデータの各種 ID | `generateSeeds.ts` が生成した ID を変更してはならない |

### 機能・デザインを壊してはいけない

- VRT（Visual Regression Tests）が失敗してはいけない
- `docs/test_cases.md` の手動テスト項目が失敗してはいけない
- Google Chrome 最新版で著しい機能落ちやデザイン差異を発生させてはいけない

### その他

- `POST /api/v1/initialize` で DB が初期値にリセットできること（採点サーバーの前提）
- 競技終了後にアプリを更新してはいけない

### デプロイ前チェック

```bash
make check   # fly.toml 差分確認 + TypeScript型チェック + ビルド確認
```

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 19 + Redux + React Router 7 + Webpack 5 + Tailwind CSS 4 |
| バックエンド | Express 5 + Sequelize 6 + SQLite |
| 言語 | TypeScript 5.9 |
| パッケージマネージャー | pnpm 10（monorepo workspace） |
| デプロイ | Fly.io（GitHub Actions 自動デプロイ） |
| テスト | Playwright E2E + VRT |

---

## よく使うコマンド

```bash
make dev            # ビルド + サーバー起動（localhost:3000）
make build          # クライアントのみビルド
make start          # サーバーのみ起動
make check          # デプロイ前チェック（必ず実行）
make score          # ローカルで Lighthouse 計測
make score-target TARGET="ホーム"   # 特定ページのみ計測
make score-prod PR=133              # デプロイ済み環境を計測
make pr             # upstream に "deploy" PR 作成 → Fly.io デプロイ
make open-board     # スコアボードをブラウザで開く
```

---

## ディレクトリ構成

```
web-speed-hackathon-2026/
├── application/
│   ├── client/         # フロントエンド（React + Webpack）
│   │   ├── src/
│   │   ├── webpack.config.js   # WASM alias・ProvidePlugin 等、複雑な設定あり
│   │   └── babel.config.js     # targets: last 1 chrome
│   ├── server/         # バックエンド（Express + SQLite）
│   │   ├── src/
│   │   └── database.sqlite     # 98MB のシード DB（採点用、変更注意）
│   └── e2e/            # Playwright VRT
├── docs/
│   ├── regulation.md   # レギュレーション（必読）
│   ├── scoring.md      # 採点方法
│   └── test_cases.md   # 手動テスト項目
├── ../adr/             # 意思決定ログ（ADR-0001〜0023）
├── ../strategy/        # 戦略ドキュメント
├── fly.toml            # ⚠️ 変更禁止
└── Makefile
```

---

## 採点の仕組み

### ページ表示（900点満点 = 9ページ × 最大100点）

各ページのスコア = 以下の合計：
- FCP × 10
- Speed Index × 10
- **LCP × 25**（最重要）
- **TBT × 30**（最重要）
- CLS × 25

計測対象: ホーム・投稿詳細・写真投稿詳細・動画投稿詳細・音声投稿詳細・DM一覧・DM詳細・検索・利用規約

**ページ表示 300点以上の場合のみ、ページ操作の採点が行われる。**

### ページ操作（250点満点 = 5シナリオ × 最大50点）

各シナリオのスコア = TBT × 25 + INP × 25

計測対象: 認証・DM・検索・Crok（AI チャット）・投稿

---

## 実施済みの主要最適化（ADR-0001〜0023）

| ADR | 施策 | 効果 |
|-----|------|------|
| 0001 | Webpack production mode 有効化 | minify・tree-shake |
| 0002 | React.lazy + route-based code splitting | 初期 JS 削減 |
| 0003 | 静的アセット Cache-Control: max-age=31536000 | キャッシュ活用 |
| 0006 | lodash・moment・jquery 除去 | ~940 KB 削減 |
| 0008 | core-js polyfill 除去（targets: last 1 chrome） | 大幅削減 |
| 0011 | brotli/gzip 事前圧縮 + WOFF2 + font-display | 転送量削減 |
| 0012 | サーバーサイドページネーション | TTFB 改善 |
| 0019 | GIF→WebM サーバーサイド変換 | LCP/TBT 改善 |
| 0020 | AspectRatioBox → CSS aspect-ratio | 500ms 遅延除去・CLS 修正 |
| 0021 | Terms ページ フォントプリロード | FCP 改善 |
| 0023 | InfiniteScroll passive・lazy loading・preload="metadata"・API キャッシュ | TBT/LCP/TTFB 改善 |

---

## webpack.config.js の注意点

複雑な設定が入っている。壊すと VRT が全滅するため慎重に変更すること。

- WASM alias × 4（`@ffmpeg/core`・`@imagemagick/magick-wasm` 等）
- `resourceQuery: /binary/` — バイナリファイルの取り扱い
- `ProvidePlugin` — `standardized-audio-context` 用
- `splitChunks` — vendor chunk 分割設定

---

## ADR の書き方

`../adr/` に `NNNN-施策名.md` で記録する。テンプレートは `../adr/template.md`。
1 施策 = 1 ADR = 1 PR が基本。

---

## デプロイフロー

```
make check → make pr → GitHub Actions → Fly.io デプロイ → 採点サーバー計測 → リーダーボード更新
```

PR URL: `https://pr-<NUM>-web-speed-hackathon-2026.fly.dev`
スコアボード: `https://web-speed-hackathon-scoring-board-2026.fly.dev/`
