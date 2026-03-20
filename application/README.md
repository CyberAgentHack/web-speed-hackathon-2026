# CaX

CaX のアプリケーションコードです。

## 開発方法

### セットアップ

1. [../docs/development.md](../docs/development.md) に記載されているセットアップを実行します
2. 依存パッケージをインストールします
   - ```bash
     bun install --frozen-lockfile
     ```

### ビルド・起動

1. アプリケーションをビルドします
   - ```bash
     bun run build
     ```
2. サーバーを起動します
   - ```bash
     bun run start
     ```
3. アプリケーションには `http://localhost:3000/` でアクセスします

## ディレクトリ構成

Bun workspaces（`package.json` の `workspaces`）を採用しています。

- `/workspaces/server` : サーバーの実装です
- `/workspaces/client` : クライアントの実装です
- `/workspaces/e2e`: E2E テストと VRT の実行環境です

## API ドキュメント

API ドキュメントを Open API YAML [./server/openapi.yaml](./server/openapi.yaml) で提供しています。

## Visual Regression Test

Playwright で Visual Regression Test (VRT) を提供しています。

競技後のレギュレーションチェックでは、 [../docs/test_cases.md](../docs/test_cases.md) 記載の手動テストに加え、VRT の結果も検証します。

### 使い方

1. Playwright 用の Chromium をインストールします
   - ```bash
     bun run --filter @web-speed-hackathon-2026/e2e playwright:install
     ```
2. ローカル環境に対してテストを実行する場合は、サーバーをあらかじめ起動しておきます
   - ```bash
     bun run build && bun run start
     ```
3. VRT を実行します
   - :warning: スクリーンショットは環境によって差異が生じるため、ご自身の環境で最初に取り直すことを推奨します
     - スクリーンショットを取り直す場合は、`bun run --filter @web-speed-hackathon-2026/e2e test:update` コマンドを実行します
   - ローカル環境に対してテストを実行する場合
     - ```bash
       bun run --filter @web-speed-hackathon-2026/e2e test
       ```
   - リモート環境に対してテストを実行する場合
     - ```bash
       E2E_BASE_URL=https://web-speed-hackathon-2026.example.com bun run --filter @web-speed-hackathon-2026/e2e test
       ```
