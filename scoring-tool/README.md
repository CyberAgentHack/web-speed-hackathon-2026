# CaX Scoring Tool

CaX のパフォーマンスを計測し、得点を計算するツールです。
GitHub Actions の計測でも同じツールを使用して採点を行なっています。

## セットアップ

1. [../docs/development.md](../docs/development.md) に記載されているセットアップを実行します
2. 依存パッケージをインストールします
   - ```bash
     pnpm install --frozen-lockfile
     ```

## 使い方

`--applicationUrl` に計測したい URL を与えて実行します

```bash
pnpm start --applicationUrl <applicationUrl>
```

### 計測名一覧を表示する

計測名一覧を表示したい場合は `--targetName` を値なしで指定します

```shell
pnpm start --applicationUrl <applicationUrl> --targetName
```

### 特定の計測だけ実行する

特定の計測だけ実行したい場合は `--targetName` に計測名を指定します

```shell
pnpm start --applicationUrl <applicationUrl> --targetName "投稿"
```

## LICENSE

MPL-2.0 by CyberAgent, Inc.
