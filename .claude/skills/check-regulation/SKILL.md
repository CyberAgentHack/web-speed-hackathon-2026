---
name: check-regulation
description: Web Speed Hackathon 2026 のレギュレーション違反をコード上でチェックする。パフォーマンス改善後の違反確認、コミット前のチェックに使用する。「レギュレーション違反チェック」「レギュレーションチェックして」といったリクエストで発動する。
---

# レギュレーション違反チェック

コード/ファイルの静的解析でレギュレーション違反がないかチェックする。
`--vrt` 引数が指定された場合は、VRT（Visual Regression Test）も追加で実行する。

## 手順

### 1. 静的チェック

Agent ツールで `check-regulation` subagent を起動する
- subagent_type は指定しない（general-purpose）
- プロンプト: 「レギュレーション違反の静的チェックを実行してください」

subagent の結果をそのままユーザーに表示する。

### 2. VRT（`--vrt` 引数がある場合のみ）

以下の手順で VRT を実行する:

1. **ビルド**: `cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/application && pnpm run build`
2. **サーバー起動**: `cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/application && pnpm run start` をバックグラウンドで実行
3. **サーバー待機**: localhost:3000 が応答するまで待つ（最大60秒）
4. **VRT 実行**: `cd /Users/hi.mochizuki/zatta/web-speed-hackathon-2026/application && pnpm run test`
5. **サーバー停止**: バックグラウンドのサーバープロセスを停止

VRT の結果をユーザーに表示する。失敗したテストがあれば詳細を報告する。
