.PHONY: dev build start pr pr-fork check score score-prod score-target open-board sync

UPSTREAM := CyberAgentHack/web-speed-hackathon-2026
APP_URL   := http://localhost:3000
PR ?= 0

# ── ローカル開発 ────────────────────────────────────────────

# クライアントをビルドしてサーバーを起動
dev: build start

# クライアントのみビルド
build:
	cd application && pnpm build

# サーバーのみ起動（ビルド済みの dist を使う）
start:
	cd application && pnpm start

# ── デプロイ前チェック ───────────────────────────────────────

# PR を出す前に必ず実行する。自動チェック + 手動確認リストを表示。
check:
	@echo "=== [1/3] fly.toml が変更されていないか ==="
	@git diff fork-upstream/main -- fly.toml | grep -q '.' \
		&& echo "❌ fly.toml が変更されています（レギュレーション違反）" && exit 1 \
		|| echo "✅ fly.toml 変更なし"
	@echo ""
	@echo "=== [2/3] TypeScript 型チェック ==="
	cd application && pnpm --filter @web-speed-hackathon-2026/client typecheck \
		&& pnpm --filter @web-speed-hackathon-2026/server typecheck
	@echo ""
	@echo "=== [3/3] ビルド成功確認 ==="
	cd application && pnpm build
	@echo ""
	@echo "=== ✅ 自動チェック完了 ==="
	@echo ""
	@echo "以下を手動で確認してから make pr を実行してください："
	@echo "  [ ] localhost:3000 で主要ページ（ホーム・投稿詳細・DM・検索）が表示される"
	@echo "  [ ] 新規投稿モーダルが開く"
	@echo "  [ ] make score でスコアが前回より改善している"
	@echo "  [ ] GET /api/v1/crok の SSE が正常に動作する（crok ページで確認）"
	@echo ""

# ── デプロイ ────────────────────────────────────────────────

# upstream に "deploy" PR を作成 → GitHub Actions が fly.io にデプロイ・採点
# PR がすでに存在する場合は push だけで Actions が再トリガーされる
pr:
	git push origin HEAD
	gh pr create \
		--repo $(UPSTREAM) \
		--base main \
		--title "deploy" \
		--body "" \
		|| echo "PR already exists – push triggered re-deploy"

# 自分の fork の main に記録用 PR を作成（詳細な説明を書く用）
pr-fork:
	git push origin HEAD
	gh pr create --base main --title "" --body ""

# upstream の最新を取り込んで fork に反映
sync:
	git fetch upstream
	git merge fork-upstream/main --ff-only
	git push origin main

# ── 採点 ────────────────────────────────────────────────────

# ローカルのアプリをスコアリングツールで計測
score:
	cd scoring-tool && pnpm start --applicationUrl $(APP_URL)

# 特定ページのみ計測（例: make score-target TARGET="ホーム"）
score-target:
	cd scoring-tool && pnpm start --applicationUrl $(APP_URL) --targetName "$(TARGET)"

# デプロイ済みの fly.io アプリを計測（例: make score-prod PR=133）
score-prod:
	@[ "$(PR)" != "0" ] || (echo "❌ PR番号を指定してください: make score-prod PR=<number>" && exit 1)
	cd scoring-tool && pnpm start --applicationUrl https://pr-$(PR)-web-speed-hackathon-2026.fly.dev

# スコアボードをブラウザで開く
open-board:
	open https://web-speed-hackathon-scoring-board-2026.fly.dev/
