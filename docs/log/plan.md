# パフォーマンス改善計画

## 全体の流れ

### ローカルで改善する（メインループ）

```
コード修正
  ↓
ビルド & サーバー起動
  ↓
スコア計測
  ↓
上がった → commit して採用
下がった → 変更を破棄
  ↓
ログに記録して次へ
```

### 本番にデプロイする（提出時）

```
git push → PR 作成 / 更新
  ↓
GitHub Actions が自動デプロイ
  ↓
PR の「View Deployment」で URL 確認
  ↓
採点サーバーに URL を登録
```

> デプロイは任意のタイミングでOK。スコアが安定してきたら push する。

---

## コマンド

### セットアップ（初回のみ）

```bash
mise trust && mise install
cd application && pnpm install --frozen-lockfile
cd ../scoring-tool && pnpm install --frozen-lockfile
```

### 改善ループ

```bash
# アプリをビルド & 起動
cd application && pnpm run build && pnpm run start

# 全ページ計測（別ターミナル）
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000

# 特定ページだけ計測
cd scoring-tool && pnpm start --applicationUrl http://localhost:3000 --targetName "ホーム"
```

### VRT（見た目の確認）

```bash
# 初回のみ
pnpm --filter "@web-speed-hackathon-2026/e2e" exec playwright install chromium
pnpm --filter "@web-speed-hackathon-2026/e2e" run test:update

# 毎回
pnpm --filter "@web-speed-hackathon-2026/e2e" run test
```

### デプロイ

```bash
git push origin main
# → GitHub で PR 作成 / 更新
```

---

## 採点のしくみ

| カテゴリ | 配点 | 詳細 |
|---------|------|------|
| ページの表示 | 900点 | 9ページ × 100点 |
| ページの操作 | 250点 | 5シナリオ × 50点　※表示 300点以上で採点 |
| **合計** | **1150点** | |

**表示スコアの内訳（1ページあたり100点）**

| 指標 | 配点 | 優先度 |
|-----|------|--------|
| TBT | 30点 | 🔴 最重要 |
| LCP | 25点 | 🟠 重要 |
| CLS | 25点 | 🟠 重要 |
| FCP | 10点 | 🟡 中 |
| SI  | 10点 | 🟡 中 |

**操作スコアの内訳（1シナリオあたり50点）**

| 指標 | 配点 |
|-----|------|
| TBT | 25点 |
| INP | 25点 |

---

## 改善サイクル

```
1. 現在のスコアを記録する
2. 改善を 1つだけ 実施する
3. ビルド → 計測
4. スコアが上がった → commit（採用）
   スコアが下がった → git checkout .（破棄）
5. 改善ログに記録する
6. 1 に戻る
```

> ⚠️ 一度に複数の変更をしない。原因の特定が難しくなる。

---

## 改善ログ

ファイル: `docs/plan/improvement-log.md`

| # | 内容 | Before | After | 差分 | 採用 | メモ |
|---|------|--------|-------|------|------|------|
| 1 | | | | | | |
| 2 | | | | | | |

---

## 計測方法

| 場面 | コマンド |
|------|---------|
| ローカル（全ページ） | `cd scoring-tool && pnpm start --applicationUrl http://localhost:3000` |
| ローカル（特定ページ） | 上記に `--targetName "ページ名"` を追加 |
| 本番 URL | `--applicationUrl https://<your-app>.fly.dev` |
| Lighthouse（補助） | `npx lighthouse http://localhost:3000 --output=json` |

---

## レギュレーション遵守チェック

改善するたびに確認する。

| # | 確認項目 | 方法 |
|---|---------|------|
| 1 | VRT テスト | `pnpm --filter "@web-speed-hackathon-2026/e2e" run test` |
| 2 | 手動テスト | `docs/test_cases.md` を目視確認 |
| 3 | 初期化 API | `curl -X POST http://localhost:3000/api/v1/initialize` |
| 4 | Crok SSE | Crok ページでメッセージ送信 → ストリーミング応答を確認 |
| 5 | fly.toml 未変更 | `git diff fly.toml` で差分なし |
| 6 | 動画の自動再生 | ホーム・投稿詳細で動画が自動再生されるか |
| 7 | 音声の波形表示 | ホーム・投稿詳細で波形が描画されるか |
| 8 | 写真の表示 | 画像が枠を覆う形で表示されるか（object-fit: cover） |

---

## 改善タスク

<!-- 自分のタスクをここに追加 -->