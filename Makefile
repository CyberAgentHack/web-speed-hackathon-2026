# Web Speed Hackathon 2026 — docs/README に沿ったよく使う操作
# 前提: mise で Node 24 / Bun が使えること（mise.toml・docs/development.md）

.DEFAULT_GOAL := help

APP_DIR        := application
SCORE_DIR      := scoring-tool
# ローカル起動時のデフォルト（application/README.md）
APPLICATION_URL ?= http://localhost:3000

.PHONY: help
help:
	@echo "利用可能なターゲット（詳細は docs/・各 README 参照）:"
	@echo ""
	@echo "  セットアップ"
	@echo "    make setup          … mise trust + mise install + アプリ・計測ツールの bun install"
	@echo "    make mise-trust     … mise trust（初回・mise.toml 変更時）"
	@echo "    make mise-install   … mise install（Node / Bun のバージョン固定）"
	@echo "    make install-app    … $(APP_DIR) で bun install --frozen-lockfile"
	@echo "    make install-scoring… $(SCORE_DIR) で bun install --frozen-lockfile"
	@echo ""
	@echo "  CaX アプリケーション（$(APP_DIR)）"
	@echo "    make build          … クライアントビルド（bun run build）"
	@echo "    make start          … サーバー起動（bun run start）→ 通常 http://localhost:3000/"
	@echo "    make typecheck      … ワークスペース全体の型チェック"
	@echo "    make format         … oxlint --fix + oxfmt"
	@echo ""
	@echo "  シード（server パッケージ）"
	@echo "    make seed-generate  … シード生成"
	@echo "    make seed-insert    … DB へシード投入"
	@echo ""
	@echo "  E2E / VRT（application/README.md）"
	@echo "    make playwright-install … Chromium の取得（初回）"
	@echo "    make e2e-test       … Playwright 実行（先に build + start しておく）"
	@echo "    make e2e-update     … スナップショット更新（環境差分がある場合）"
	@echo "    E2E_BASE_URL=https://... make e2e-test … リモート向け"
	@echo ""
	@echo "  ローカル採点（scoring-tool/README.md）"
	@echo "    make score          … Lighthouse 計測（APPLICATION_URL を上書き可）"
	@echo "    make score-targets  … 計測名一覧"
	@echo "    make format-scoring … scoring-tool のフォーマット"
	@echo ""
	@echo "  コンテナ（Dockerfile — 本番相当ビルド）"
	@echo "    make docker-build   … docker build（ポート 8080 想定）"

.PHONY: setup mise-trust mise-install install install-app install-scoring
setup: mise-trust mise-install install

mise-trust:
	mise trust

mise-install:
	mise install

install: install-app install-scoring

install-app:
	cd $(APP_DIR) && bun install --frozen-lockfile

install-scoring:
	cd $(SCORE_DIR) && bun install --frozen-lockfile

.PHONY: build start typecheck format
build:
	cd $(APP_DIR) && bun run build

start:
	cd $(APP_DIR) && bun run start

typecheck:
	cd $(APP_DIR) && bun run typecheck

format:
	cd $(APP_DIR) && bun run format

.PHONY: seed-generate seed-insert
seed-generate:
	cd $(APP_DIR) && bun run --filter @web-speed-hackathon-2026/server seed:generate

seed-insert:
	cd $(APP_DIR) && bun run --filter @web-speed-hackathon-2026/server seed:insert

.PHONY: playwright-install e2e-test e2e-update
playwright-install:
	cd $(APP_DIR) && bun run --filter @web-speed-hackathon-2026/e2e playwright:install

e2e-test:
	cd $(APP_DIR) && \
		$(if $(E2E_BASE_URL),E2E_BASE_URL=$(E2E_BASE_URL) ,)bun run --filter @web-speed-hackathon-2026/e2e test

e2e-update:
	cd $(APP_DIR) && bun run --filter @web-speed-hackathon-2026/e2e test:update

.PHONY: score score-targets format-scoring
score:
	cd $(SCORE_DIR) && bun run start --applicationUrl $(APPLICATION_URL)

score-targets:
	cd $(SCORE_DIR) && bun run start --applicationUrl $(APPLICATION_URL) --targetName

format-scoring:
	cd $(SCORE_DIR) && bun run format

.PHONY: docker-build
docker-build:
	docker build -t web-speed-hackathon-2026 .
