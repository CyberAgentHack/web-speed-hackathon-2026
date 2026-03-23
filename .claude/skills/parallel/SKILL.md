---
name: parallel
description: >
  git worktree を使って1リポジトリから複数の作業ディレクトリを作り、
  各ブランチで独立した並列開発を行うスキル。
  「並列で作業したい」「worktree を作って」「別ブランチで同時に開発したい」
  「タスクごとにブランチ切りたい」「複数タスクを同時進行したい」
  「worktree 一覧」「worktree 削除」といった文脈で使う。
  複数の Claude Code インスタンスが同時に作業する場合や、
  レビュー待ちの間に別タスクを始めたい場合に特に有効。
argument-hint: "<タスク名 | list | remove タスク名>"
---

# Parallel Branch Development

git worktree を活用し、1つのリポジトリで複数タスクを並列開発するためのスキル。

## なぜ worktree を使うのか

通常の `git checkout -b` では1作業ディレクトリ = 1ブランチしか扱えない。
複数の AI インスタンスや人間が同時に作業するとブランチ切り替えが衝突する。
git worktree なら、同一リポジトリから複数の作業ディレクトリを派生させ、
それぞれ独立したブランチで安全に並行作業できる。

## 基本ルール

- 1タスク = 1 worktree = 1 branch
- base branch はリポジトリの default branch を自動検出する（後述）
- worktree ディレクトリは `../worktrees/<task-name>` に作成する
- main（またはmaster）ブランチの作業ディレクトリは変更しない
- 他の worktree のファイルを変更しない

## 操作一覧

このスキルは3つの操作をサポートする。

### 1. worktree 作成（新規タスク開始）

#### Step 1: base branch を自動検出

```bash
git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'
```

これが失敗する場合は `git remote show origin | grep 'HEAD branch'` で取得する。
どちらも失敗したら、ユーザーに base branch を確認する。

#### Step 2: タスク名と種別を決定

ユーザーの入力からタスク名を決める。スペースはハイフンに変換し、英小文字にする。

種別（prefix）はタスク内容から判断する：
- `feature/` — 新機能追加（デフォルト）
- `fix/` — バグ修正
- `chore/` — リファクタ、設定変更、依存更新など

例: タスク「add search filter」→ ブランチ名 `feature/add-search-filter`

#### Step 3: worktree を作成

```bash
git fetch origin
git worktree add ../worktrees/<task-name> -b <prefix>/<task-name> origin/<base-branch>
```

`origin/<base-branch>` をベースにすることで、最新のリモート状態から分岐する。

#### Step 4: 作業ディレクトリで実装を開始

作成された worktree のパスをユーザーに伝え、そのディレクトリで作業を行う。

#### Step 5: 完了時の出力

以下を出力する：
- 作成したブランチ名
- 作成した worktree パス（絶対パス）
- 実装内容の要約

#### Step 6: コンフリクトの警告

同じファイルが他の既存 worktree でも変更されている可能性がある場合は警告する。
他の worktree で変更中のファイルは以下で確認できる：

```bash
for wt in $(git worktree list --porcelain | grep '^worktree ' | awk '{print $2}'); do
  echo "=== $wt ==="
  git -C "$wt" diff --name-only 2>/dev/null
  git -C "$wt" diff --cached --name-only 2>/dev/null
done
```

#### Step 7: PR 作成

PR を作成する際は通常通りコミット＆プッシュして `gh pr create` を使う。

### 2. worktree 一覧表示

ユーザーが「worktree 一覧」「今のworktreeは？」などと聞いた場合：

```bash
git worktree list
```

各 worktree のパス、HEAD のコミットハッシュ、ブランチ名を表形式で見やすく出力する。

### 3. worktree 削除（タスク完了後のクリーンアップ）

#### 削除前の確認

削除する前に、以下を必ずチェックする：

1. **未コミットの変更がないか**
   ```bash
   git -C ../worktrees/<task-name> status --porcelain
   ```
2. **未プッシュのコミットがないか**
   ```bash
   git -C ../worktrees/<task-name> log --oneline origin/<base-branch>..HEAD
   ```

どちらかに該当する場合は、ユーザーに警告し確認を取る。

#### 削除の実行

```bash
git worktree remove ../worktrees/<task-name>
```

ブランチの削除はユーザーに確認してから行う（マージ済みなら提案する）：

```bash
git branch -d <prefix>/<task-name>
```

## 注意事項

- worktree 内で `git checkout` で別ブランチに切り替えないこと（worktree の意味がなくなる）
- 同じブランチを複数の worktree で同時にチェックアウトすることはできない（git の制約）
- worktree ディレクトリを手動で削除した場合は `git worktree prune` で参照を掃除する

引数: $ARGUMENTS
