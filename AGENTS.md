# Web Speed Hackathon 攻略用 Claude Code 設定

## 競技公式ドキュメント (`docs/`)

競技の公式仕様・ルール・採点基準が記載されている。**変更前に必ず確認すること。**

### [`docs/regulation.md`](./docs/regulation.md)

レギュレーション (許可・禁止事項・要求事項)。

| 項目 | 要点 |
|------|------|
| 許可 | コード・ファイルの全変更可、外部 SaaS 利用可 |
| **禁止** | `fly.toml` の変更、VRT/手動テスト回避コード、SSE プロトコル変更、競技後のデプロイ更新 |
| 要求 | `POST /api/v1/initialize` でデータが初期値にリセットされること、競技終了後もアクセス可能なこと |

- **「これを変更して失格にならないか？」**を確認するとき
- **SSE (`GET /api/v1/crok`) 周辺を触るとき**は必読

### [`docs/scoring.md`](./docs/scoring.md)

採点方法・スコア計算式 (1150 点満点)。

| 種別 | 配点 | メトリクス |
|------|------|-----------|
| ページの表示 (9 ページ) | 900 点 | FCP×10 / SI×10 / LCP×25 / TBT×30 / CLS×25 |
| ページの操作 (5 シナリオ) | 250 点 | TBT×25 / INP×25 |

- **「ページの表示」で 300 点以上取らないと「ページの操作」が採点されない**
- 採点対象ページ・シナリオの一覧を確認するとき

### [`docs/test_cases.md`](./docs/test_cases.md)

手動テスト項目 (レギュレーションチェックの基準)。機能落ちを起こしていないか確認する。

主なチェックポイント:
- 投稿: TIFF 画像・WAV 音声・MKV 動画の投稿、動画の5秒切り抜き・正方形クロップ
- Crok: SSE ストリーミング、Markdown/数式/シンタックスハイライトのレンダリング
- DM: リアルタイム更新、既読管理、入力中インジケータ
- 検索: 無限スクロール、感情極性判定、since/until フィルタ
- 利用規約: 源ノ明朝 (Noto Serif JP) フォントの表示

### [`docs/development.md`](./docs/development.md)

開発環境セットアップ手順。`mise` を使用。

- `/application` : CaX アプリ本体
- `/scoring-tool` : パフォーマンス計測ツール

### [`docs/deployment.md`](./docs/deployment.md)

デプロイ手順。fork → PR 作成 → GitHub Actions で fly.io に自動デプロイ。

- PR 下部の `View Deployment` からアクセス可能
- **`fly.toml` は絶対に変更しないこと**
- fly.io 以外へのデプロイも可 (費用は自己負担)

### [`docs/assets/`](./docs/assets/)

テスト用サンプルファイル。

| ファイル | 用途 |
|--------|------|
| `analoguma.png` / `analoguma.tiff` | 画像投稿テスト用 |
| `maoudamashii_shining_star.wav` | 音声投稿テスト用 |
| `pixabay_326739_kanenori_himejijo.mkv` | 動画投稿テスト用 |

---

## 2026 年競技メモ (`scraps/2026/`)

競技中に発見した仕込み・問題点・対応状況を記録する作業ログ。
**新しい発見や対応結果はここに追記すること。**

| ファイル | 内容 |
|--------|------|
| [`scraps/2026/findings.md`](./scraps/2026/findings.md) | Phase 0 調査結果。仕込み箇所・重大ビルド設定問題・重いライブラリ一覧・TODO リスト。 |

---

## 攻略ドキュメント (`scraps/`)

**競技中は `scraps/checklist.md` を上から順に実行することがメインの作業。**
他のドキュメントは必要に応じて参照する。

### [`scraps/checklist.md`](./scraps/checklist.md)

競技中に上から順に実行する実践手順書 (Phase 0〜8)。コマンド例・コードスニペット付き。

| Phase | 内容 | 読むタイミング |
|-------|------|------------|
| Phase 0 | 準備・初期計測 | **競技開始直後** |
| Phase 1 | ビルド設定修正・Vite 移行 | Phase 0 完了後すぐ |
| Phase 2 | バンドルサイズ削減 | Phase 1 完了後 |
| Phase 3 | 意図的な遅延の除去 | Phase 2 完了後 |
| Phase 4 | アセット最適化 | Phase 3 完了後 |
| Phase 5 | バックエンド・ネットワーク最適化 | Phase 4 完了後 |
| Phase 6 | CDN / インフラ | Phase 5 完了後 |
| Phase 7 | React レンダリング最適化 | Phase 6 完了後 |
| Phase 8 | 最終確認 | **競技終了 30 分前に必ず** |

### [`scraps/README.md`](./scraps/README.md)

WSH の概要・戦略・スコア計算式・メトリクス別対策・ツールリファレンス。

- **スコア計算式を確認したい**とき (年度ごとに異なる)
- **メトリクス (TBT/LCP/CLS/FCP/INP) の改善方針**を確認したいとき
- **インフラ選択** (Cloudflare/Heroku/VPS) の実績を確認したいとき
- **ライブラリ代替一覧** (moment→day.js 等) を確認したいとき
- **FFmpeg・画像・フォントのコマンド例**を確認したいとき
- **バンドルサイズ目標値**を確認したいとき

### [`scraps/traps.md`](./scraps/traps.md)

失格パターン・毎年仕込まれる罠の一覧。

- **失格を避けたい**とき (競技中・最終確認前に必ず読む)
- **「なぜかスコアが上がらない」「テストが落ちる」**とき
- **毎年の仕込みパターン** (ReDoS・p-min-delay・スクロール位置保存) を確認したいとき

### [`scraps/years.md`](./scraps/years.md)

2020〜2025 年の年度別アプリ詳細・仕込み問題・参加記まとめ。

- **今年の傾向を読みたい**とき (事前学習・テーマ予想)
- **「過去に似た問題があったか」**を調べたいとき
- **具体的な仕込みの手口**を把握したいとき

### [`scraps/urls.md`](./scraps/urls.md)

参考にした記事・参加記の URL 一覧。詳細を調べたいときに参照する。

## ローカル専用スクリプト (`_local/`)

`_local/` は `.gitignore` に登録済みの個人用ディレクトリ。
競技環境固有のトークン・設定を含むスクリプト類をここに置いてよい。
**リポジトリには絶対コミットしないこと。**

| ファイル | 内容 |
|--------|------|
| [`_local/view-fly-log.sh`](./_local/view-fly-log.sh) | デプロイ先 Fly.io アプリのログをストリーミング表示するスクリプト。アクセストークンがハードコードされている。 |

## インストール済みスキル

以下のスキルがインストールされている。**該当するタスクが発生したら積極的に呼び出すこと。**

スキルが見つからない・動作しない場合は以下を実行する:

```bash
pnpm dlx skills experimental_install
```

Claude Code など `.agents/skills/` を参照しない AI エージェントを使っている場合は、必要に応じてシンボリックリンクを貼る:

```bash
mkdir -p .claude && ln -s ../.agents/skills .claude/skills
```

`.agents/skills/` や `.claude/skills/` が `.gitignore` に含まれていない場合は追加する:

```
.agents/skills/
.claude/skills/
```

### Vite 移行・ビルド設定

| シチュエーション | 呼び出すスキル |
|--------------|-------------|
| webpack → Vite 移行、vite.config.ts の設定、Rolldown 対応 | `vite` (antfu/skills) |

### パフォーマンス最適化 (全般)

| シチュエーション | 呼び出すスキル |
|--------------|-------------|
| 画像・フォント・アニメーション・バンドルを網羅的に最適化する | `optimize` (pbakaus/impeccable) |
| フロント＋バックエンドのパフォーマンスチェックリストを適用する | `performance-optimization` (supercent-io/skills-template) |
| Web パフォーマンス全般の改善方針を確認する | `web-performance-optimization` (sickn33/antigravity-awesome-skills) |

### Lighthouse / Core Web Vitals

| シチュエーション | 呼び出すスキル |
|--------------|-------------|
| LCP・INP・CLS の改善方針を確認する | `core-web-vitals` (addyosmani/web-quality-skills) |
| 読み込み・ランタイムのパフォーマンスを深掘りする | `performance` (addyosmani/web-quality-skills) |
| Web 品質を総合的に監査する | `web-quality-audit` (addyosmani/web-quality-skills) |
| モダン Web 標準・ベストプラクティスを確認する | `best-practices` (addyosmani/web-quality-skills) |

### React 最適化

| シチュエーション | 呼び出すスキル |
|--------------|-------------|
| React の再レンダリング・バンドル・async waterfall を最適化する | `vercel-react-best-practices` (vercel-labs/agent-skills) |

### アセット最適化

| シチュエーション | 呼び出すスキル |
|--------------|-------------|
| FFmpeg で動画・音声を変換・圧縮・HLS 化する | `ffmpeg` (digitalsamba/claude-code-video-toolkit) |

### DB 最適化

| シチュエーション | 呼び出すスキル |
|--------------|-------------|
| SQL クエリ・インデックス・N+1 を最適化する | `sql-optimization-patterns` (wshobson/agents) |
