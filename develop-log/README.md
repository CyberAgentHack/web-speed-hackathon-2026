# Develop Log

このディレクトリは、パフォーマンス改善の実施記録です。

- 記録形式: `develop-log/NN-title.md`
- 記録内容: 背景、実施内容、変更ファイル、リスク、検証結果
- 計測方針: ユーザー方針変更により、ローカル採点計測は実施しない

## 実施一覧

1. [01-build-and-babel-optimization.md](./01-build-and-babel-optimization.md)
2. [02-startup-render-blocking-reduction.md](./02-startup-render-blocking-reduction.md)
3. [03-http-client-async-fetch-migration.md](./03-http-client-async-fetch-migration.md)
4. [04-infinite-scroll-and-server-pagination.md](./04-infinite-scroll-and-server-pagination.md)
5. [05-dm-autoscroll-polling-removal.md](./05-dm-autoscroll-polling-removal.md)
6. [06-server-cache-and-connection-optimization.md](./06-server-cache-and-connection-optimization.md)
7. [07-crok-suggestion-and-tokenizer-cache.md](./07-crok-suggestion-and-tokenizer-cache.md)
8. [08-spa-link-and-layout-observer-optimization.md](./08-spa-link-and-layout-observer-optimization.md)
9. [09-initial-bundle-splitting-and-lazy-loading.md](./09-initial-bundle-splitting-and-lazy-loading.md)
10. [10-tailwind-static-build-and-initial-render-reduction.md](./10-tailwind-static-build-and-initial-render-reduction.md)

## 実施結果
- 01 ~ 08
  - https://github.com/CyberAgentHack/web-speed-hackathon-2026-scoring/issues/73

- 09
  - ローカル採点計測は未実施（途中中断）

- 10
  - ローカル採点計測は未実施（ユーザー実施方針）
