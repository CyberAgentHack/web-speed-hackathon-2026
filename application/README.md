# CaX

CaX のアプリケーションコードです。

## 開発方法

### セットアップ

1. [../docs/development.md](../docs/development.md) に記載されているセットアップを実行します
2. 依存パッケージをインストールします
   - ```bash
     pnpm install --frozen-lockfile
     ```

### ビルド・起動

1. アプリケーションをビルドします
   - ```bash
     pnpm run build
     ```
2. サーバーを起動します
   - ```bash
     pnpm run start
     ```
3. アプリケーションには `http://localhost:3000/` でアクセスします

## Lighthouse CLI

ローカルで Lighthouse CLI を使って HTML / JSON レポートを保存できます。

### 前提

- アプリケーションを `http://localhost:3000/` で起動しておきます
- 初回は依存パッケージをインストールします
  - ```bash
    pnpm install --frozen-lockfile
    ```

### 使い方

- mobile 計測
  - ```bash
    pnpm run analyze:lighthouse:mobile
    ```
- desktop 計測
  - ```bash
    pnpm run analyze:lighthouse:desktop
    ```
- 既定では mobile でトップページを計測
  - ```bash
    pnpm run analyze:lighthouse
    ```

別 URL を測る場合は `--url` を付けます。

```bash
pnpm run analyze:lighthouse:mobile -- --url http://localhost:3000/settings
```

### 出力先

レポートは `reports/lighthouse/` に保存されます。

- HTML: `reports/lighthouse/<slug>.<device>.report.html`
- JSON: `reports/lighthouse/<slug>.<device>.report.json`

例:

- `reports/lighthouse/home.mobile.report.html`
- `reports/lighthouse/home.mobile.report.json`
- `reports/lighthouse/settings.desktop.report.html`
- `reports/lighthouse/settings.desktop.report.json`

## ディレクトリ構成

pnpm workspaces を採用しています。

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
     pnpm --filter "@web-speed-hackathon-2026/e2e" exec playwright install chromium
     ```
2. ローカル環境に対してテストを実行する場合は、サーバーをあらかじめ起動しておきます
   - ```bash
     pnpm run build && pnpm run start
     ```
3. VRT を実行します
   - :warning: スクリーンショットは環境によって差異が生じるため、ご自身の環境で最初に取り直すことを推奨します
     - スクリーンショットを取り直す場合は、`pnpm run test:update` コマンドを実行します
   - ローカル環境に対してテストを実行する場合
     - ```bash
       pnpm run test
       ```
   - リモート環境に対してテストを実行する場合
     - ```bash
       E2E_BASE_URL=https://web-speed-hackathon-2026.example.com pnpm run test
       ```
