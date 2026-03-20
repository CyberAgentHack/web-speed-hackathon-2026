# 09 Build and Deploy Time Reduction

## 背景

ビルド＆デプロイに約1時間かかるとの報告があり、CI/CDの待ち時間がボトルネックになっていた。

## 実施内容

- `.dockerignore` を見直し
  - Docker build context から不要ディレクトリを除外
  - `scoring-tool`, `develop-log`, `docs`, `.github`, `application/e2e`, `application/dist` を除外
- `Dockerfile` を改善
  - 依存インストールを `client/server` ワークスペースに限定
  - ビルド実行を `client` のみに限定
  - 最終イメージへのコピーを最小構成化（`server`, `public`, `dist`, `node_modules`, ルート最小ファイルのみ）
- `.github/workflows/deploy-pr.yml` を改善
  - `concurrency.cancel-in-progress: true` を追加
  - 同一 PR の古いデプロイジョブを自動キャンセル

## 期待される効果

- Docker context 転送量の削減
- Docker build 中の依存解決時間短縮
- 同一PRでの無駄な重複デプロイ待ち時間の削減
- Fly.io へのイメージ転送時間の短縮（最終イメージ縮小）

## リスクと対策

- リスク: 最終イメージに必要ファイルが不足する可能性
- 対策: ルート起動に必要な `package.json`, `pnpm-workspace.yaml`, `server`, `public`, `dist`, `node_modules` を明示コピー

## 検証結果

- `pnpm --dir application run build` 成功
- ローカル採点計測は方針により未実施
