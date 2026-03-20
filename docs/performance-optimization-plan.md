# Web Speed Hackathon 2026 パフォーマンス最適化 実装計画

## 問題定義

- 目的は、`README.md` / `docs/scoring.md` に基づく Lighthouse 総合得点（表示 900 + 操作 250）を最大化しつつ、`docs/regulation.md` / `docs/test_cases.md` の機能・見た目要件を維持すること。
- 重要制約:
  - `fly.toml` は変更しない。
  - `GET /api/v1/crok{?prompt}` の SSE プロトコルは変更しない。
  - `POST /api/v1/initialize` による初期化要件を維持する。
  - VRT と手動テスト項目を満たす。

## CLI移行前提（Claude Code CLI）

- 実装作業は Claude Code CLI で進める。
- 本計画は、CLI 固有機能に依存しない「対象ファイル・実施順・検証条件」を定義する。
- Copilot CLI 固有の実行モードは前提にせず、通常の `pnpm` / `git` / `node` コマンドで再現できる形で運用する。

## 現状分析（主要ボトルネック）

1. クライアント通信
   - `application/client/src/utils/fetchers.ts` が `async: false` の同期 XHR を多用しており、メインスレッドをブロック。
2. 無限スクロールと API 利用
   - `use_infinite_fetch.ts` が毎回「全件取得してクライアント側で slice」しており、ネットワーク/CPU 負荷が高い。
3. 静的配信
   - `server/src/app.ts` で全レスポンスに `Cache-Control: max-age=0` と `Connection: close` を付与。
   - `server/src/routes/static.ts` でも etag/lastModified が無効。
4. 画像/音声/動画描画
   - `CoveredImage`/`PausableMovie`/`SoundPlayer` が表示のたびにバイナリ取得・変換を行い、初期描画コストが高い。
5. バンドル設定
   - `client/webpack.config.js` が `mode: none`、`minimize: false`、`splitChunks: false` で本番最適化が無効。
6. API クエリ
   - 検索や投稿取得で過剰取得/重複取得しやすく、表示・操作ともに遅延要因。

## アプローチ（CCSSアーキテクチャの考え方を適用）

- **責務分離で最適化**: 「配信層」「API/DB 層」「フロント描画層」「ビルド層」に分割し、変更の影響範囲を明確化。
- **フェイルセーフ重視**: レギュレーション違反リスクが高い領域（Crok SSE、媒体品質、初期化 API）は契約を固定したまま高速化。
- **検証先行**: 変更ごとに typecheck/build/scoring/e2e を通し、スコア改善と仕様維持を同時に確認。

## Todo（実装順）

### 0) `claude-code-handoff`

- 目的:
  - Claude Code CLI へ移行した状態で、制約・ボトルネック・実行順・検証コマンドを引き継ぐ。
- 対象:
  - `docs/performance-optimization-plan.md`
  - 必須参照ドキュメント（`README.md`, `docs/deployment.md`, `docs/development.md`, `docs/regulation.md`, `docs/scoring.md`, `docs/test_cases.md`）
- 完了条件:
  - Claude Code CLI 側で、同一の前提とチェックリストで実装開始できる。

### 1) `baseline-measurement`

- 目的:
  - 現行スコアと主要指標（FCP/LCP/TBT/INP）の基準値を確定する。
- 対象:
  - `scoring-tool`（全体/ページ別/操作別）
  - `application/e2e`（VRT）
- 完了条件:
  - 最適化前のスコアと失敗ケースを記録し、改善比較が可能な状態。

### 2) `optimize-static-delivery`

- 目的:
  - 表示スコア改善（FCP/LCP）に効く配信ヘッダーを最適化。
- 対象:
  - `application/server/src/app.ts`
  - `application/server/src/routes/static.ts`
- 方針:
  - HTML/API と静的アセットでキャッシュポリシーを分離。
  - keep-alive を有効化（不要な `Connection: close` を撤廃）。
  - 必要に応じて圧縮配信を導入。

### 3) `optimize-api-pagination`

- 目的:
  - 投稿/検索/DM の過剰取得を削減し、表示・操作双方を短縮。
- 対象:
  - `application/server/src/routes/api/post.ts`
  - `application/server/src/routes/api/search.ts`
  - `application/server/src/routes/api/direct_message.ts`
  - （必要に応じて）モデル/インデックス定義
- 方針:
  - `limit`/`offset` を一貫適用、重複クエリを整理、ソートを DB 側で完結。

### 4) `optimize-client-fetching`

- 目的:
  - メインスレッドブロッキングを排除し、INP/TBT を改善。
- 対象:
  - `application/client/src/utils/fetchers.ts`
  - `application/client/src/hooks/use_fetch.ts`
  - `application/client/src/hooks/use_infinite_fetch.ts`
  - `application/client/src/components/foundation/InfiniteScroll.tsx`
- 方針:
  - 同期 XHR を非同期 fetch ベースへ移行。
  - 無限スクロールを API ページング前提へ変更。
  - スクロール判定の高負荷処理を軽量化（IntersectionObserver など）。

### 5) `optimize-media-rendering`

- 目的:
  - 画像/動画/音声を「必要時ロード」に寄せ、初期表示コストを削減。
- 対象:
  - `application/client/src/components/foundation/CoveredImage.tsx`
  - `application/client/src/components/foundation/PausableMovie.tsx`
  - `application/client/src/components/foundation/SoundPlayer.tsx`
  - `application/server/src/routes/api/image.ts`（ALT 情報活用の改善余地）
- 方針:
  - 一覧表示でのバイナリ変換処理を最小化。
  - ただし、`docs/test_cases.md` の EXIF ALT / 音声メタデータ / 動画品質要件は維持。

### 6) `optimize-crok-streaming`

- 目的:
  - Crok 操作シナリオの操作スコア改善（TBT/INP/体感待ち時間）。
- 対象:
  - `application/server/src/routes/api/crok.ts`
  - `application/client/src/containers/CrokContainer.tsx`（必要に応じて）
- 方針:
  - SSE プロトコルを維持したまま、不要な人工遅延を短縮。
  - `crok-response.md` と同等表示要件は保持。

### 7) `optimize-client-bundle`

- 目的:
  - JS/CSS 転送量と初期実行時間を削減。
- 対象:
  - `application/client/webpack.config.js`
  - `application/client/package.json`
  - 重い依存を使うコンポーネント（翻訳/Markdown/変換）
- 方針:
  - 本番最適化（minify/splitChunks/tree shaking）を有効化。
  - 重い機能を遅延ロード化し、初期ルートの負荷を下げる。

### 8) `run-regression-and-scoring`

- 目的:
  - 最終成果の品質保証とレギュレーション適合確認。
- 対象:
  - build/typecheck/scoring/e2e/manual test 観点
- 完了条件:
  - `docs/regulation.md` と `docs/test_cases.md` の要件を満たし、スコア改善が再現可能。

## 依存関係

- `claude-code-handoff` 完了後に `baseline-measurement` へ進む。
- `baseline-measurement` 完了後に 2〜7 を並行着手可能。
- `run-regression-and-scoring` は 2〜7 完了後に実施。
- `optimize-media-rendering` は `optimize-api-pagination`/`optimize-client-fetching` と整合して進める。

## 検証戦略

- 変更単位で以下を回す:
  - `application`: `pnpm run typecheck` / `pnpm run build`
  - `scoring-tool`: `pnpm start --applicationUrl <url>`（必要に応じて target 指定）
  - `application/e2e`: `pnpm run test`
- 必須確認:
  - VRT が落ちないこと。
  - 手動テスト項目（特に投稿メディア、DM、Crok、検索）が維持されること。
  - `fly.toml` 未変更、`/api/v1/initialize` 正常動作、Crok SSE 契約維持。

## 前提・確認済み事項

- `optimize-crok-streaming` は、SSE プロトコルを維持したまま人工遅延（TTFT/文字間隔）を短縮する方針で進める。
- 外部SaaS/CDNを使わず、まずはアプリケーション内最適化を優先する前提で計画している（必要なら方針変更）。

## Claude Code CLI での実行コマンド例

- 依存インストール
  - `pnpm --dir application install --frozen-lockfile`
  - `pnpm --dir scoring-tool install --frozen-lockfile`
- アプリ検証
  - `pnpm --dir application run typecheck`
  - `pnpm --dir application run build`
- 計測
  - `pnpm --dir scoring-tool start --applicationUrl http://localhost:3000`
- E2E/VRT
  - `pnpm --dir application --filter @web-speed-hackathon-2026/e2e run test`
