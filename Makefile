-include .env

APP_URL ?= http://localhost:3000

.PHONY: help build dev analyze test test-update test-remote score score-remote typecheck format seed initialize initialize-remote logs

help:
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

build: ## クライアントをビルドする
	pnpm -C application build

dev: build ## ビルド → ローカルサーバー起動 (ポート 3000)
	pnpm -C application start

analyze: ## バンドルサイズを可視化 → bundle-report.html
	pnpm -C application --filter @web-speed-hackathon-2026/client analyze

test: ## VRT テストを実行する
	pnpm -C application --filter @web-speed-hackathon-2026/e2e test

test-update: ## VRT ベースライン更新 (メモリに注意)
	pnpm -C application --filter @web-speed-hackathon-2026/e2e test:update

test-remote: ## VRT テストをリモート環境に対して実行する (REMOTE_URL)
	E2E_BASE_URL=$(REMOTE_URL) pnpm -C application --filter @web-speed-hackathon-2026/e2e test

score: ## ローカルスコア計測 (APP_URL=$(APP_URL))
	pnpm -C scoring-tool start --applicationUrl $(APP_URL)

score-remote: ## リモートスコア計測 (REMOTE_URL)
	pnpm -C scoring-tool start --applicationUrl $(REMOTE_URL)

typecheck: ## 型チェック
	pnpm -C application typecheck

format: ## フォーマット
	pnpm -C application format

seed: ## シードデータを生成して DB に投入する
	pnpm -C application --filter @web-speed-hackathon-2026/server seed:generate
	pnpm -C application --filter @web-speed-hackathon-2026/server seed:insert

initialize: ## POST /api/v1/initialize でデータリセット (APP_URL=$(APP_URL))
	curl -sf -X POST $(APP_URL)/api/v1/initialize && echo "OK"

initialize-remote: ## リモートのデータリセット (REMOTE_URL)
	curl -sf -X POST $(REMOTE_URL)/api/v1/initialize && echo "OK"

logs: ## Fly.io のログをストリーミング表示
	fly logs --app $(FLY_APP_NAME) --access-token $(FLY_ACCESS_TOKEN)
