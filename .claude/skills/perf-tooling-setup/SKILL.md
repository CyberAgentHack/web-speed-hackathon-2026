---
name: perf-tooling-setup
description: Lighthouse CLI と chrome-devtools MCP の導入・設定を行う。「lighthouse を入れて」「chrome-devtools mcp を入れて」「計測環境をセットアップして」といった場面で使う。計測自体には perf-measure を使うこと。
---

# Performance Tooling Setup

## 使い分け

| ツール | 用途 | 備考 |
|--------|------|------|
| scoring-tool | 公式採点と同じ方法で計測 | `scoring-tool/` に同梱済み |
| Lighthouse CLI | 個別ページの詳細計測 | `npx lighthouse` |
| chrome-devtools MCP | トレース分析、ネットワーク監視 | `.mcp.json` に設定 |

## ワークフロー

### Step 1: scoring-tool のセットアップ

```bash
cd scoring-tool && pnpm install --frozen-lockfile
```

動作確認:
```bash
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000 --targetName
```

### Step 2: Lighthouse CLI の確認

```bash
npx lighthouse --version
npx lighthouse http://localhost:3000/ --output json --output-path /tmp/test.json --chrome-flags="--headless" --only-categories=performance
```

### Step 3: .mcp.json を整える

最低限必要な設定:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

既存の `mcpServers` がある場合は、その中に `chrome-devtools` を追加する。

### Step 4: 動作確認

MCP 側は `.mcp.json` が正しく設定され、Claude から `chrome-devtools` サーバーが見えることを確認する。

## よくあるエラー

| エラー | 原因 | 対処 |
|-------|------|------|
| `lighthouse: command not found` | グローバルインストールされていない | `npx lighthouse` を使う |
| `Chrome not found` | Chromium パスが設定されていない | `CHROME_PATH` を設定 |
| `chrome-devtools MCP に接続できない` | `.mcp.json` の設定不備 | 上記の設定例を確認 |
| `Port 9222 is already in use` | 別の Chrome がデバッグポート使用中 | 不要な Chrome プロセスを終了 |
| scoring-tool で依存エラー | pnpm install 未実行 | `cd scoring-tool && pnpm install` |
