# 引数なしで `just` を実行したとき、`just --list` と同様に recipe 一覧を表示する。
[group('ヘルプ')]
default:
  @just --list

app_dir := "application"
score_dir := "scoring-tool"

# `mise trust`、`mise install`、`application` と `scoring-tool` の `pnpm install --frozen-lockfile` を順番に実行し、開発に必要な Node.js / pnpm と依存関係をそろえる。
[group('セットアップ')]
setup:
  mise trust
  mise install
  pnpm --dir {{app_dir}} install --frozen-lockfile
  pnpm --dir {{score_dir}} install --frozen-lockfile

# `application` で `pnpm install --frozen-lockfile` を実行し、アプリケーション側の workspace 依存関係だけをインストールする。
[group('セットアップ')]
install-application:
  pnpm --dir {{app_dir}} install --frozen-lockfile

# `scoring-tool` で `pnpm install --frozen-lockfile` を実行し、採点ツール側の依存関係だけをインストールする。
[group('セットアップ')]
install-scoring-tool:
  pnpm --dir {{score_dir}} install --frozen-lockfile

# ルートの `mise install` を実行し、`mise.toml` に定義された Node.js 24.14.0 と pnpm 10.32.1 をそろえる。
[group('セットアップ')]
mise-install:
  mise install

# `application` で `pnpm run build` を実行し、その中で `@web-speed-hackathon-2026/client` の webpack build を呼び出して `application/dist` を生成する。
[group('ルート')]
build:
  pnpm --dir {{app_dir}} run build

# `application` で `pnpm run start` を実行し、その中で `@web-speed-hackathon-2026/server` の `tsx src/index.ts` を起動して `http://localhost:3000/` を提供する。
[group('ルート')]
start:
  pnpm --dir {{app_dir}} run start

# `application` で `pnpm run format` を実行し、`oxlint --fix` と `oxfmt` を順番に走らせてアプリケーション配下を整形する。
[group('ルート')]
format:
  pnpm --dir {{app_dir}} run format

# `application` で `pnpm run typecheck` を実行し、workspace 全体の `typecheck` script を再帰実行して client / server / e2e の型検査をまとめて行う。
[group('ルート')]
typecheck:
  pnpm --dir {{app_dir}} run typecheck

# `application/client` に対して `pnpm --filter @web-speed-hackathon-2026/client run build` を実行し、フロントエンドだけを webpack でビルドする。
[group('フロントエンド')]
build-client:
  pnpm --dir {{app_dir}} --filter @web-speed-hackathon-2026/client run build

# `application/client` に対して `pnpm --filter @web-speed-hackathon-2026/client run analyze` を実行し、`application/reports/bundle-report.html` と `application/reports/webpack-stats.json` を出力する。
[group('フロントエンド')]
analyze-bundle:
  pnpm --dir {{app_dir}} --filter @web-speed-hackathon-2026/client run analyze

# `application/client` に対して `pnpm --filter @web-speed-hackathon-2026/client run typecheck` を実行し、フロントエンドだけを TypeScript で型検査する。
[group('フロントエンド')]
typecheck-client:
  pnpm --dir {{app_dir}} --filter @web-speed-hackathon-2026/client run typecheck

# `application/server` に対して `pnpm --filter @web-speed-hackathon-2026/server run start` を実行し、バックエンドだけを `tsx src/index.ts` で起動する。
[group('バックエンド')]
start-server:
  pnpm --dir {{app_dir}} --filter @web-speed-hackathon-2026/server run start

# `application/server` に対して `pnpm --filter @web-speed-hackathon-2026/server run typecheck` を実行し、バックエンドだけを TypeScript で型検査する。
[group('バックエンド')]
typecheck-server:
  pnpm --dir {{app_dir}} --filter @web-speed-hackathon-2026/server run typecheck

# `application/server` に対して `pnpm --filter @web-speed-hackathon-2026/server run seed:generate` を実行し、シード生成スクリプト `scripts/generateSeeds.ts` を動かす。
[group('データベース')]
seed-generate:
  pnpm --dir {{app_dir}} --filter @web-speed-hackathon-2026/server run seed:generate

# 注意: 既存データへ投入する可能性があるため、内容を確認してから使う。`application/server` に対して `pnpm --filter @web-speed-hackathon-2026/server run seed:insert` を実行し、シード投入スクリプト `scripts/insertSeeds.ts` を動かす。
[group('データベース')]
seed-insert:
  pnpm --dir {{app_dir}} --filter @web-speed-hackathon-2026/server run seed:insert

# `application/e2e` に対して `pnpm --filter @web-speed-hackathon-2026/e2e exec playwright install chromium` を実行し、VRT 用の Chromium をインストールする。
[group('品質')]
install-playwright:
  pnpm --dir {{app_dir}} --filter @web-speed-hackathon-2026/e2e exec playwright install chromium

# `application/e2e` に対して `pnpm --filter @web-speed-hackathon-2026/e2e run test` を実行し、Playwright による VRT / E2E テストを走らせる。
[group('品質')]
test:
  pnpm --dir {{app_dir}} --filter @web-speed-hackathon-2026/e2e run test

# `application/e2e` に対して `pnpm --filter @web-speed-hackathon-2026/e2e run test:update` を実行し、Playwright のスナップショットを更新する。
[group('品質')]
test-update:
  pnpm --dir {{app_dir}} --filter @web-speed-hackathon-2026/e2e run test:update

# `application` で `pnpm run analyze:lighthouse` を実行し、既定の mobile 設定で `reports/lighthouse/*.report.html` と `*.report.json` を出力する。
[group('分析')]
analyze-lighthouse:
  pnpm --dir {{app_dir}} run analyze:lighthouse

# `application` で `pnpm run analyze:lighthouse:mobile` を実行し、mobile 設定で `reports/lighthouse/*.mobile.report.{html,json}` を出力する。
[group('分析')]
analyze-lighthouse-mobile:
  pnpm --dir {{app_dir}} run analyze:lighthouse:mobile

# `application` で `pnpm run analyze:lighthouse:desktop` を実行し、desktop 設定で `reports/lighthouse/*.desktop.report.{html,json}` を出力する。
[group('分析')]
analyze-lighthouse-desktop:
  pnpm --dir {{app_dir}} run analyze:lighthouse:desktop

# `application` で既存の `public/images/**/*.webp` と `public/movies/**/*.webm` を再圧縮候補として dry-run し、サイズが減るものだけ `reports/public-media-recompression-report.json` にまとめる。
[group('分析')]
recompress-public-media:
  pnpm --dir {{app_dir}} run recompress:public-media:dry-run

# `application` で既存の `public/images/**/*.webp` と `public/movies/**/*.webm` を再圧縮し、しきい値以上に軽くなったファイルだけ上書きする。適用後は VRT と手動確認を前提に使う。
[group('分析')]
recompress-public-media-apply:
  pnpm --dir {{app_dir}} run recompress:public-media

# `application` で大きい投稿画像の `.avif` 変換候補を dry-run し、`reports/avif-variant-report.json` に削減見込みをまとめる。
[group('分析')]
generate-avif-variants:
  pnpm --dir {{app_dir}} run generate:avif-variants:dry-run

# `application` で大きい投稿画像に `.avif` を生成し、クライアントの AVIF 対応 ID 一覧も更新する。適用後は VRT と代表画像の目視確認を前提に使う。
[group('分析')]
generate-avif-variants-apply:
  pnpm --dir {{app_dir}} run generate:avif-variants

# `analyze-bundle` と `analyze-lighthouse` を順番に実行し、bundle 可視化と Lighthouse の両方のレポートをまとめて更新する。
[group('分析')]
analyze-all: analyze-bundle analyze-lighthouse

# `scoring-tool` で `pnpm run format` を実行し、採点ツール配下に対して `oxlint --fix` と `oxfmt` を順番に走らせる。
[group('ヘルパー')]
format-scoring:
  pnpm --dir {{score_dir}} run format

# `scoring-tool` で `pnpm start --applicationUrl {{application_url}}` を実行し、指定した URL をローカル採点ツールで計測する。
[group('ヘルパー')]
score application_url:
  pnpm --dir {{score_dir}} start --applicationUrl {{application_url}}

# `scoring-tool` で `pnpm start --applicationUrl {{application_url}} --targetName` を実行し、指定 URL に対して計測可能な target 名一覧を表示する。
[group('ヘルパー')]
score-targets application_url:
  pnpm --dir {{score_dir}} start --applicationUrl {{application_url}} --targetName

# `scoring-tool` で `pnpm start --applicationUrl {{application_url}} --targetName {{target_name}}` を実行し、指定した target だけを採点する。
[group('ヘルパー')]
score-target application_url target_name:
  pnpm --dir {{score_dir}} start --applicationUrl {{application_url}} --targetName {{target_name}}
