# Web Speed Hackathon 2026 - アーキテクチャ概要

このドキュメントは、CaX アプリケーションの構成、責務分割、データフロー、採点準備のための技術的なアーキテクチャを整理しています。パフォーマンス最適化の前提知識として活用してください。

---

## 全体構成

このリポジトリは **アプリケーション本体** と **採点ツール** の2層で構成されています。

| 層 | 内容 | 責務 |
|:---|:---|:---|
| アプリケーション本体 | `./application/` | 競技対象の SPA + API サーバー |
| 採点ツール | `./scoring-tool/` | Lighthouse 自動計測・スコア集計 CLI |

### pnpm Workspace 構成

アプリケーション本体は monorepo（pnpm workspace） で3パッケージに分割されています：

```
application/
├── client/          # React SPA クライアント
├── server/          # Express API + 静的配信
├── e2e/             # Playwright E2E/VRT テスト
├── package.json     # ワークスペース定義
└── pnpm-workspace.yaml
```

詳細は [`../application/pnpm-workspace.yaml`](../application/pnpm-workspace.yaml)、[`../application/package.json`](../application/package.json) を参照。

---

## サーバー起動フロー

### 初期化順序

1. **データベース初期化**  
   SQLite ファイルをテンポラリディレクトリにコピーし、Sequelize で初期化  
   [`application/server/src/sequelize.ts`](../application/server/src/sequelize.ts)

2. **Express アプリ構築**  
   ミドルウェアチェーンを組立  
   [`application/server/src/app.ts`](../application/server/src/app.ts)

3. **ポート Listen**  
   `process.env.PORT || 3000` で起動  
   [`application/server/src/index.ts`](../application/server/src/index.ts)

### ミドルウェアスタック

```
session middleware
    ↓
body parser (JSON + binary)
    ↓
共通レスポンスヘッダ付与
    ↓
API ルータ (/api/v1/*)
    ↓
静的ルータ (SPA fallback + 静的配信)
    ↓
エラーハンドラ
```

詳細は [`application/server/src/app.ts`](../application/server/src/app.ts)。

---

## クライアント層

### アプリケーション起動

```typescript
// window load 後に React をマウント
window.addEventListener("load", () => {
  createRoot(document.getElementById("app")!).render(
    <Provider store={store}>
      <BrowserRouter>
        <AppContainer />
      </BrowserRouter>
    </Provider>,
  );
});
```

Entry: [`application/client/src/index.tsx`](../application/client/src/index.tsx)

### ページ構造

AppContainer が SPA ルーティングの中心で、各機能毎に専用 Container を配置

| 機能 | パス | Container |
|:---|:---|:---|
| ホーム/タイムライン | `/` | TimelineContainer |
| 投稿詳細 | `/posts/:postId` | PostContainer |
| DM 一覧 | `/dm` | DirectMessageListContainer |
| DM 詳細 | `/dm/:conversationId` | DirectMessageContainer |
| ユーザープロフィール | `/users/:username` | UserProfileContainer |
| 検索 | `/search` | SearchContainer |
| Crok AI チャット | `/crok` | CrokContainer |
| 利用規約 | `/terms` | TermContainer |

詳細は [`application/client/src/containers/AppContainer.tsx`](../application/client/src/containers/AppContainer.tsx)。

### 状態管理

**グローバル状態**
- Redux で管理されるが、主に `form` reducer のみ
- [`application/client/src/store/index.ts`](../application/client/src/store/index.ts)

**ローカル状態**
- 各 Container の React `useState()` が中心
- フェッチ結果、UI 状態、フォーム値など

### 通信ユーティリティ

jQuery ajax ベースで 3 種類の関数を提供：

| 関数 | 用途 | 特徴 |
|:---|:---|:---|
| `fetchJSON()` | GET リクエスト | キャッシュ無し、自動デコード |
| `sendJSON()` | POST リクエスト | **gzip 圧縮して送信** |
| `sendFile()` | ファイルアップロード | バイナリストリーム |

詳細は [`application/client/src/utils/fetchers.ts`](../application/client/src/utils/fetchers.ts)。

### データ取得パターン

**1. 単純フェッチ**
```typescript
const { data, isLoading, error } = useFetch(url, fetcher);
```

**2. 無限スクロール**
```typescript
const { data, fetchMore } = useInfiniteFetch(url, fetcher);
// → 全件取得後、クライアント側で LIMIT=30 ずつ slice
```

詳細は [`application/client/src/hooks/use_fetch.ts`](../application/client/src/hooks/use_fetch.ts)、[`application/client/src/hooks/use_infinite_fetch.ts`](../application/client/src/hooks/use_infinite_fetch.ts)。

### リアルタイム通信

**WebSocket**
- DM 未読カウント sync
- 会話メッセージ push
- typing indicator

[`application/client/src/hooks/use_ws.ts`](../application/client/src/hooks/use_ws.ts)、[`application/client/src/containers/DirectMessageContainer.tsx`](../application/client/src/containers/DirectMessageContainer.tsx)

**SSE (Server-Sent Events)**
- Crok AI チャット 1文字ずつストリーミング

[`application/client/src/hooks/use_sse.ts`](../application/client/src/hooks/use_sse.ts)、[`application/client/src/containers/CrokContainer.tsx`](../application/client/src/containers/CrokContainer.tsx)

---

## サーバーAPI 層

### ルーティング構成

```
/api/v1/
├── /initialize           POST   → [採点前リセット点]
├── /users/
│   ├── /me               GET    → [現在のセッションユーザー]
│   ├── /:username        GET    → [ユーザー詳細]
│   └── /:username/posts  GET    → [ユーザー投稿一覧]
├── /posts/
│   ├── /                 GET    → [投稿タイムライン]
│   ├── /:postId          GET    → [投稿詳細]
│   ├── /:postId/comments GET    → [投稿コメント一覧]
│   └── /                 POST   → [新規投稿]
├── /search               GET    → [テキスト/ユーザー/日付検索]
├── /dm
│   ├── /                 GET    → [DM 会話一覧]
│   ├── /                 POST   → [1:1 会話作成]
│   ├── /:conversationId  GET    → [会話詳細]
│   ├── /:conversationId/ws       → [リアルタイム push]
│   └── /:conversationId/messages POST   → [メッセージ送信]
├── /signup               POST   → [新規登録]
├── /signin               POST   → [ログイン]
├── /signout              POST   → [ログアウト]
├── /crok/suggestions     GET    → [QA サジェスト]
├── /crok                 GET    → [SSE ストリーマー]
├── /images               POST   → [画像アップロード]
├── /movies               POST   → [動画アップロード]
└── /sounds               POST   → [音声アップロード]
```

詳細は [`application/server/src/routes/api.ts`](../application/server/src/routes/api.ts)。

### 認証・セッション

- **実装**: express-session with MemoryStore
- **情報**: `req.session.userId` に代えて認可判定
- **データ**: DB リセット時に session store クリア

詳細は [`application/server/src/session.ts`](../application/server/src/session.ts)、[`application/server/src/routes/api/auth.ts`](../application/server/src/routes/api/auth.ts)。

### 主要ドメイン機能

**投稿（Post）**
- Timeline: limit/offset ペーペジネーション
- 詳細表示: eager load で image/movie/sound を含有
- 作成: メディア関連付け対応

[`application/server/src/routes/api/post.ts`](../application/server/src/routes/api/post.ts)

**検索（Search）**
- テキスト検索（キーワード）
- ユーザー名・ユーザー名検索
- 日付範囲フィルター（since/until）
- 重複排除後、作成日時でソート

[`application/server/src/routes/api/search.ts`](../application/server/src/routes/api/search.ts)

**DM（DirectMessage）**
- 会話一覧: 最新メッセージでソート
- 会話詳細: メッセージ全体を eager load
- 未読: eventhub で push
- typing indicator: 一時的な通知

[`application/server/src/routes/api/direct_message.ts`](../application/server/src/routes/api/direct_message.ts)

**Crok チャット**
- 提案一覧取得
- SSE で固定応答を 10ms 間隔でストリーミング

[`application/server/src/routes/api/crok.ts`](../application/server/src/routes/api/crok.ts)

**メディア アップロード**
- クライアントから バイナリ受信
- サーバー側でファイル保存
- ファイル形式検証（file-type）

[`application/server/src/routes/api/image.ts`](../application/server/src/routes/api/image.ts)、[`application/server/src/routes/api/movie.ts`](../application/server/src/routes/api/movie.ts)、[`application/server/src/routes/api/sound.ts`](../application/server/src/routes/api/sound.ts)

---

## データモデル層（Sequelize）

### ORM 初期化

全モデルを Sequelize インスタンスに登録後、**関連定義を一括で設定**

[`application/server/src/models/index.ts`](../application/server/src/models/index.ts)

### モデル一覧

| モデル | 責務 | defaultScope |
|:---|:---|:---|
| User | ユーザー基本情報 | profileImage を include |
| Post | テキスト投稿 | user/images/movie/sound を include |
| Image | 投稿添付画像 | 多対多（PostsImagesRelation 経由） |
| Movie | 動画ファイル | Post に従属 |
| Sound | 音声ファイル | Post に従属、メタデータ保持 |
| Comment | 投稿への返信 | user を include |
| DirectMessage | メッセージ行 | sender/conversation を include、afterSave hook で eventhub emit |
| DirectMessageConversation | 1:1 会話スレッド | initiator/member/messages を include |
| ProfileImage | プロフィール画像 | User に従属 |
| PostsImagesRelation | 多対多リレーション | 中間テーブル |
| QaSuggestion | Crok サジェスト | Crok用 QA ペア |

### 重要なポイント

**defaultScope による注意**
```typescript
// Post の defaultScope
include: [
  { association: "user", include: [{ association: "profileImage" }] },
  { association: "images", through: { attributes: [] } },
  { association: "movie" },
  { association: "sound" },
]
```

→ **API が常に fat model 返却を前提に設計されている**。N+1 クエリ回避前提。

**Hook による Side Effect**
```typescript
// DirectMessage.afterSave
// → eventhub に dm:conversation/:id:message emit
// → 該当会話の ws クライアントが即座に受信
```

詳細は [`application/server/src/models/DirectMessage.ts`](../application/server/src/models/DirectMessage.ts)。

---

## リアルタイム通信機構

### WebSocket：DM + Unread

**パス**: `/api/v1/dm/:conversationId/ws`, `/api/v1/dm/unread/ws`

**実装**: Express 拡張で `.ws()` メソッドをプロトタイプ汚染

[`application/server/src/utils/express_websocket_support.ts`](../application/server/src/utils/express_websocket_support.ts)

**イベントフロー**
```
DirectMessage.afterSave hook
    ↓
eventhub.emit("dm:conversation/:id:message", message)
    ↓
各クライアント ws.send({ type: "dm:conversation:message", payload })
```

### SSE：Crok AI チャット

**パス**: `/api/v1/crok?prompt=...`

**スペック**
- Content-Type: text/event-stream
- キャッシュ: no-cache
- TTFTシミュレーション: 3秒 sleep

詳細は [`application/server/src/routes/api/crok.ts`](../application/server/src/routes/api/crok.ts)。

---

## ビルド・デプロイメント

### Webpack（クライアント）

**設定**: [`application/client/webpack.config.js`](../application/client/webpack.config.js)

**エントリ**
```javascript
entry: {
  main: [
    "core-js",
    "regenerator-runtime/runtime",
    "jquery-binarytransport",
    "./src/index.css",
    "./src/buildinfo.ts",
    "./src/index.tsx",
  ],
}
```

**最適化：意図的に緩い**
```javascript
optimization: {
  minimize: false,
  splitChunks: false,
  concatenateModules: false,
  usedExports: false,
  sideEffects: false,
}
```

→ デバッグ・カスタマイズを容易に

### Docker マルチステージビルド

```dockerfile
# build stage: client を webpack でビルド
node:24.14.0-slim
  → pnpm install
  → node build (client webpack)
  → pnpm install --prod (server 依存)

# runtime stage: server 起動
node:24.14.0-slim
  → pnpm start = tsx src/index.ts
```

詳細は [`./Dockerfile`](../Dockerfile)。

### 配備：Fly.io

- **地域**: nrt (成田)
- **ポート**: 8080
- **HTTPS**: force_https = true
- **オートスケール**: min_machines_running = 0
- **VM**: shared 1CPU, 2048MB RAM

詳細は [`./fly.toml`](../fly.toml)。

---

## 採点ツール（scoring-tool）

### 役割

Lighthouse 自動計測 + スコア集計 CLI。GitHub Actions で呼び出される。

[`./scoring-tool/src/index.ts`](../scoring-tool/src/index.ts)

### 計測対象（TARGET）

#### ページ表示 (9ページ × 100点 = 900点満点)

1. ホーム
2. 投稿詳細
3. 写真つき投稿詳細
4. 動画つき投稿詳細
5. 音声つき投稿詳細
6. DM 一覧
7. DM 詳細
8. 検索
9. 利用規約

**スコア計算**
```
FCP Score × 10  (0-10)
+ SI Score × 10  (0-10)
+ LCP Score × 25  (0-25)
+ TBT Score × 30  (0-30)
+ CLS Score × 25  (0-25)
---
= 各ページ 100点 × 9 = 910点
```

#### ユーザーフロー (5シナリオ × 50点 = 250点満点)

1. ユーザー登録 → サインアウト → サインイン
2. DM 送信
3. 検索 → 結果表示
4. Crok AI チャット
5. テキスト投稿 → メディア投稿

**スコア計算**
```
TBT Score × 25  (0-25)
+ INP Score × 25  (0-25)
---
= 各シナリオ 50点 × 5 = 250点
```

### 重要な閾値

**「ページの表示」が 300点未満の場合**
→ ユーザーフロー計測はスキップ、0点扱い

→ **最優先で「ページ表示系」の底上げから着手すべき**

詳細は [`../docs/scoring.md`](../scoring.md)。

### 実行フロー

```
$ pnpm start --applicationUrl http://localhost:3000

1. /api/v1/initialize POST → DB リセット
2. Landing Targets (9ページ) 計測
   ↓
3. Landing Score < 300 ?
   YES → User Flow は 0点スキップ
   NO → User Flow (5シナリオ) 計測
4. スコア集計・表示
5. Dashboard サーバーへ送信（オプション）
```

詳細は [`../scoring-tool/src/calculate.ts`](../scoring-tool/src/calculate.ts)。

---

## E2E・VRT テスト

### Playwright 設定

- **ブラウザ**: Chrome
- **形式**: Desktop 1920×1080
- **Worker**: 論理CPU数 ÷ 2（デフォルト）
- **リトライ**: 失敗時 1 回
- **タイムアウト**: 300 秒、アクション 30 秒

詳細は [`../application/e2e/playwright.config.ts`](../application/e2e/playwright.config.ts)。

### テスト構成

各テストは `login()` 後、機能毎に VRT スクリーンショットを取得

**ユーティリティ**
- `login()`: 定型ログイン
- `waitForVisibleMedia()`: img/video/audio の読込完了待ち
- `scrollEntire()`: 全スクロール
- `dynamicMediaMask()`: GIF フレーム変化をマスク

詳細は [`../application/e2e/src/utils.ts`](../application/e2e/src/utils.ts)。

---

## 最適化の視点

### 採点スコアリング構造による優先度

| 層 | スコア | 到達基準 | 推奨焦点 |
|:---|:---|:---|:---|
| ページ表示 | 900点 | **300点以上で次へ進む** | **最優先** |
| - FCP | 10点 | First Contentful Paint | 初期 HTML/CSS |
| - SI | 10点 | Speed Index | メディア読込 |
| - LCP | 25点 | Largest Contentful Paint | メイン画像/テキスト |
| - TBT | 30点 | Total Blocking Time | JS 実行時間 |
| - CLS | 25点 | Cumulative Layout Shift | レイアウト安定性 |
| ユーザーフロー | 250点 | 300点達成済みの場合 | TBT + INP |
| - TBT | 25点 | Total Blocking Time | イベントハンドラ |
| - INP | 25点 | Interaction to Next Paint | UI レスポンス |

### 実装レイヤ別・改善ポイント

**クライアント側**
- Bundle サイズ (core-js, 依存関係)
- 無限スクロール実装の N+1（全件取得してる）
- メディアの幅広い依存（@ffmpeg, @imagemagick）
- jQuery + gzip 圧縮の通信オーバーヘッド

**サーバー側**
- defaultScope による過剰 eager load
- Sequelize クエリの最適化（必要な属性のみ）
- メディア処理のブロッキング

**配備・環境**
- Docker イメージサイズ
- 静的配信の キャッシュ戦略
- Fly.io オートスケール時の遅延

詳細は同様に [`./development.md`](../docs/development.md)、[`./regulation.md`](../docs/regulation.md) を参照。

---

## ドキュメント一覧

| ドキュメント | 対象 |
|:---|:---|
| [development.md](../docs/development.md) | セットアップ・ローカル開発実行 |
| [deployment.md](../docs/deployment.md) | デプロイ手順 |
| [scoring.md](../docs/scoring.md) | 採点ルール詳細 |
| [regulation.md](../docs/regulation.md) | レギュレーション・禁止事項 |
| [test_cases.md](../docs/test_cases.md) | 品質ゲート（手動テスト） |
| **architecture.md** | **このファイル。技術構成全体** |
