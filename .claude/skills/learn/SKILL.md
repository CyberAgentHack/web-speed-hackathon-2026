---
name: learn
description: 学んだことをGitHub Wikiに追記する。技術的な知見、パフォーマンス改善のTips、ツールの使い方などの振り返りメモに使用。
allowed-tools: Bash(git *), Read, Write
argument-hint: "[学んだ内容やトピック]"
---

# 学んだことをWikiに追記

GitHub Wikiの「学んだこと」ページに、新しい知見を追記する。

## 手順

1. Wikiリポジトリを `/tmp/web-speed-hackathon-2026.wiki` にclone（既にあればpull）
2. `学んだこと.md` を読み、既存のカテゴリ・フォーマットを確認
3. 適切なカテゴリの下に追記（なければ新カテゴリ作成）
4. commitしてpush

## 既存カテゴリ
- Webパフォーマンス基礎
- Git/GitHub操作
- ツール活用

## フォーマット例

```markdown
### トピックタイトル
具体的な説明。コード例があれば含める。

```bash
# コマンド例
command --flag value
```
```

## 注意
- 既存の内容は絶対に消さない（追記のみ）
- 既にある知見と重複しないか確認する
- 実際に試して確認した内容のみ記載する

引数: $ARGUMENTS
