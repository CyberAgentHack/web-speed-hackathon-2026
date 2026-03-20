---
description: PRを作成する（背景・意図・代替案を含む詳細な説明付き）
---

# PR作成

引数 `$ARGUMENTS` にはIssue番号を指定してください（例: `/create-pr 2`）。

## Step 1: 変更内容の把握

以下を並列で実行し、PRに含まれる全変更を把握する:

- `git status`
- `git diff feat/performance-improvement...HEAD`（ベースブランチからの全差分）
- `git log --oneline feat/performance-improvement..HEAD`（全コミット）

## Step 2: PR説明文の作成

以下の構成で **日本語** の説明文を作成する。
コミット履歴だけでなく、コード差分を読み込んで正確に記述すること。

### 必須セクション

1. **背景** — なぜこの変更が必要か。現状の問題点を具体的な数値やコードで示す
2. **達成したいこと** — この変更で得られる効果を箇条書きで列挙する
3. **変更内容** — ファイルごとに何を変えたかを簡潔に記述する
4. **なぜこの方法をとったか** — 技術選定の理由、リスク評価、既存コードとの整合性を説明する
5. **検討したが採用しなかった方法** — 代替案とその不採用理由を記述する（最低1つ）
6. **検証結果** — 実際に確認した内容をテーブル形式で記載する

## Step 3: PRの作成

```bash
gh pr create \
  --repo KenyaMasuko/web-speed-hackathon-2026 \
  --base feat/performance-improvement \
  --head <現在のブランチ名> \
  --title "<type>: <簡潔なタイトル（70文字以内）>" \
  --body "<Step 2で作成した説明文>"
```

- タイトルのtypeはconventional commitsに従う（perf, feat, fix, refactor, docs, chore）
- bodyはHEREDOC (`cat <<'EOF'`) で渡す
- 完了後、PRのURLを報告する

## 注意事項

- 未コミットの変更がある場合は先にコミットするか確認する
- `feat/performance-improvement` ブランチがベース
- リポジトリは `KenyaMasuko/web-speed-hackathon-2026`（fork）
