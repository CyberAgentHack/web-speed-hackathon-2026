# 01 Build and Babel Optimization

## 背景

クライアントビルドが開発向け設定のままになっており、圧縮・最適化・tree-shaking が十分に効かない状態だった。

## 実施内容

- `application/client/package.json`
  - `build` を `NODE_ENV=production webpack` に変更
- `application/client/webpack.config.js`
  - `mode` を `NODE_ENV` ベースで `production/development` 切替
  - `devtool` を本番時 `false`、開発時 `eval-cheap-module-source-map` に変更
  - `optimization` の意図的な無効化設定を削除（webpack デフォルト最適化を有効化）
  - `cache` を `filesystem` に変更
  - `EnvironmentPlugin` の `NODE_ENV` を固定値から環境変数連動へ変更
  - `entry` から `core-js` / `regenerator-runtime` / `jquery-binarytransport` の常時注入を削除
  - `ProvidePlugin` から jQuery 注入を削除（`Buffer` / `AudioContext` のみ維持）
- `application/client/babel.config.js`
  - `targets: "last 1 Chrome major version"` に変更
  - `modules: false` で ESModules を維持
  - `bugfixes: true` を有効化
  - `@babel/preset-react` の `development` を `NODE_ENV` 連動に変更

## 影響範囲

- クライアントのビルド生成物全体（JS/CSS）
- 既存の画面仕様や API 仕様には非影響

## リスクと対策

- リスク: 古いブラウザ向け互換性の低下
- 対策: 本競技要件は Chrome 最新版前提のため、要件範囲内であることを確認

## 検証結果

- `pnpm --dir application run build` が成功することを確認
- ローカル採点計測は方針により未実施
