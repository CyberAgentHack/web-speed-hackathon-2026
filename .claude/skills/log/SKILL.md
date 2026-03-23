---
name: log
description: 作業ログをGitHub Wikiに追記する。作業の記録、進捗報告、日次サマリーに使用。
allowed-tools: Bash(git *), Read, Write
argument-hint: "[作業内容の要約]"
---

# 作業ログをWikiに追記

GitHub Wikiの「作業ログ」ページに、今日の作業内容を追記する。

## 手順

1. Wikiリポジトリを `/tmp/web-speed-hackathon-2026.wiki` にclone（既にあればpull）
2. `作業ログ.md` を読み、既存のフォーマットに合わせる
3. 今日の日付セクションがなければ `## YYYY-MM-DD` を追加
4. 引数で渡された内容を箇条書きで追記
5. 関連するissue番号やPRがあればリンクを含める
6. commitしてpush

## フォーマット例

```markdown
## 2026-03-20

### セクションタイトル
- 実施した内容の説明
- 関連: #123, #456

#### 学び
- 作業中に得た知見があればここに記載
```

## 注意
- 既存の内容は絶対に消さない（追記のみ）
- 同じ日付のセクションが既にある場合はその中に追記する

引数: $ARGUMENTS
