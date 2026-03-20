# Web Speed Hackathon 2026 — Copilot Instructions

## プロジェクト概要

架空の SNS「CaX」のパフォーマンスを最適化する競技。Lighthouse スコア最大 1150 点（表示 900 + 操作 250）。

## アーキテクチャ

```
application/
  client/   — React 19 + Redux + React Router, Webpack, Tailwind CSS v4
  server/   — Express (TypeScript, tsx で直接実行), SQLite3, セッション認証
  e2e/      — Playwright VRT テスト（Desktop Chrome）
  public/   — 静的アセット（フォント、画像、動画、音声、辞書）
scoring-tool/ — Lighthouse ベースのローカル計測ツール
```

- **パスエイリアス**: `@web-speed-hackathon-2026/client/*`, `@web-speed-hackathon-2026/server/*`
- **エントリ**: クライアントは `client/src/index.tsx`、サーバーは `server/src/app.ts`
- **API**: `/api/v1` 配下。Crok（AIチャット）は SSE ストリーミング

## ツールチェイン

| ツール | バージョン |
|--------|-----------|
| Node.js | 24.14.0 |
| pnpm | 10.32.1 |
| mise | ツール管理 (`mise trust && mise install`) |

## コマンド一覧

```bash
# セットアップ
mise trust && mise install
cd application && pnpm install

# ビルド・起動
pnpm build                    # クライアントビルド (Webpack, production)
pnpm start                    # サーバー起動 (port 8080/3000)

# 型チェック
pnpm typecheck                # 全パッケージ

# フォーマット
pnpm format                   # oxlint + oxfmt

# バンドル解析
cd client && pnpm analyze     # WEBPACK_ANALYZE=1

# DB シード
cd server && pnpm seed:generate && pnpm seed:insert

# E2E テスト (VRT)
cd e2e && pnpm test           # Playwright (E2E_BASE_URL=http://localhost:3000)
cd e2e && pnpm test:update    # スナップショット更新

# ローカル計測
cd scoring-tool && pnpm start
```

## レギュレーション（厳守）

> 詳細: [docs/regulation.md](../docs/regulation.md)

- VRT と手動テスト項目を壊さない（機能落ち・デザイン差異 NG）
- シードの各種 ID を変更しない
- `GET /api/v1/crok{?prompt}` の SSE プロトコルを変更しない
- Crok の画面情報は SSE 以外で伝達しない
- `fly.toml` を変更しない
- `POST /api/v1/initialize` でデータベースが初期値にリセットされること

## 採点ポイント

- **表示**（9ページ × 100点）: FCP(10), SI(10), LCP(25), TBT(30), CLS(25)
- **操作**（5シナリオ × 50点）: TBT(25), INP(25)  ※表示300点以上で操作採点開始

## パフォーマンス改善の方針

> 詳細: [docs/performance-bottlenecks.md](../docs/performance-bottlenecks.md)

**変更前に必ず VRT で回帰確認すること。**

### 最優先
1. 同期 XHR → fetch/async に置換 (`client/src/utils/fetchers.ts`)
2. IE11 ターゲット → モダンブラウザ (`client/babel.config.js`)
3. Tailwind CDN ランタイム → ビルド時 CSS (`client/src/index.html`)
4. 巨大ライブラリ削減 (jQuery, moment, lodash, bluebird 等)
5. WASM 巨大バイナリ → サーバーサイド処理 or 削除

### 高優先
6. キャッシュヘッダー設定 (`server/src/app.ts`)
7. コード分割 (`React.lazy`, dynamic import)
8. `font-display: swap` (`client/src/index.css`)
9. 1ms ポーリング → イベント駆動
10. 1ms setInterval → MutationObserver

## コーディング規約

- **言語**: TypeScript (strict mode, `@tsconfig/strictest`)
- **フォーマッター**: oxfmt / oxlint（Prettier/ESLint ではない）
- **CSS**: Tailwind CSS v4（PostCSS で処理）
- **パッケージ管理**: pnpm（`saveExact: true`、shellEmulator 有効）
- **モジュール**: ESModules（`modules: false` in Babel）
- **React**: JSX 自動変換（`runtime: "automatic"`）

## 注意事項

- `pnpm add` すると lockfile 内の git ベース依存の SHA が更新されることがある
- Webpack ビルドは `NODE_OPTIONS="--max-old-space-size=4096"` が必要な場合あり
- E2E テストの並列ワーカー数は `E2E_WORKERS` で調整可能
- スクリーンショット差分許容: 3%（`maxDiffPixelRatio: 0.03`）
