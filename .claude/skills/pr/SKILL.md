# PR作成スキル

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Current remotes: !`git remote -v`

## Your task

Based on the above changes:

1. main ブランチにいる場合は新しいフィーチャーブランチを作成する（`perf/`, `fix/`, `chore/`, `ci/` などのプレフィックスを使用）
2. 変更内容に基づいて適切なコミットメッセージで単一のコミットを作成する
3. origin に push する
4. `gh pr create` で PR を作成する。以下のルールを厳守:
   - `--repo leonard475192/web-speed-hackathon-2026` を必ず指定する
   - upstream（CyberAgentHack）には絶対に PR を作らない
   - タイトルは70文字以内
   - body は以下のテンプレートを使用:

```
gh pr create \
  --repo leonard475192/web-speed-hackathon-2026 \
  --base main \
  --title "prefix: short description" \
  --body "$(cat <<'EOF'
## Summary
- 変更点1
- 変更点2

## Test plan
- [ ] テスト項目

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

5. You have the capability to call multiple tools in a single response. You MUST do all of the above in a single message. Do not use any other tools or do anything else. Do not send any other text or messages besides these tool calls.
