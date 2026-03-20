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

実際によく使う例:

```shell
pnpm start --applicationUrl http://localhost:3000 --targetName "ホームを開く"
pnpm start --applicationUrl http://localhost:3000 --targetName "DM詳細ページを開く"
pnpm start --applicationUrl http://localhost:3000 --targetName "ユーザーフロー: ユーザー登録"
```

## 計測が失敗したときの確認手順

1. アプリが起動しているか: `http://localhost:3000` が開けることを確認

1. 初期化 API が応答するか: `curl -X POST http://localhost:3000/api/v1/initialize`

1. URL の指定ミスがないか: `--applicationUrl` が正しいか確認

1. 単体計測で再現するか: まず `--targetName` で 1 シナリオに絞る

1. サインイン系失敗の切り分け: `signup -> signout -> signin` を API 単体で確認してから UI 側を調査

## LICENSE

MPL-2.0 by CyberAgent, Inc.
