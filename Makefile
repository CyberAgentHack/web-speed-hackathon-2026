# Web Speed Hackathon 2026 — docs/README に沿ったよく使う操作
# 前提: mise で Node 24 / Bun が使えること（mise.toml・docs/development.md）

.DEFAULT_GOAL := help

APP_DIR        := application
SCORE_DIR      := scoring-tool
# ローカル起動時のデフォルト（application/README.md）
APPLICATION_URL ?= http://localhost:3000
# E2E テストの絞り込み（空の場合は全件）
E2E_SPEC ?=
E2E_GREP ?=

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
	@echo "    make clean          … ビルド成果物・E2E 一時出力の削除（$(APP_DIR)/dist など）"
	@echo ""
	@echo "  シード（server パッケージ）"
	@echo "    make seed-generate  … シード生成"
	@echo "    make seed-insert    … DB へシード投入"
	@echo "    make db-reset       … DB を初期シードで再作成"
	@echo ""
	@echo "  E2E / VRT（application/README.md）"
	@echo "    make playwright-install … Chromium の取得（初回）"
	@echo "    make e2e-test       … Playwright 実行（E2E_SPEC/E2E_GREP で絞り込み可）"
	@echo "    make e2e-core       … ホーム/検索/投稿詳細/利用規約/レスポンシブ"
	@echo "    make e2e-auth       … 認証/ユーザー詳細"
	@echo "    make e2e-post       … 投稿機能中心"
	@echo "    make e2e-dm         … DM 機能"
	@echo "    make e2e-crok       … Crok チャット"
	@echo "    make e2e-full       … 全件実行（最終確認向け）"
	@echo "    make e2e-update     … スナップショット更新（環境差分がある場合）"
	@echo "    E2E_BASE_URL=https://... make e2e-test … リモート向け"
	@echo "    make e2e-test E2E_SPEC=\"src/posting.test.ts\" E2E_GREP=\"画像\""
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

.PHONY: build start typecheck format clean
build:
	cd $(APP_DIR) && bun run build

clean:
	rm -rf $(APP_DIR)/dist $(APP_DIR)/e2e/test-results

start:
	cd $(APP_DIR) && bun run start

typecheck:
	cd $(APP_DIR) && bun run typecheck

format:
	cd $(APP_DIR) && bun run format

.PHONY: seed-generate seed-insert db-reset
seed-generate:
	cd $(APP_DIR) && bun run --filter @web-speed-hackathon-2026/server seed:generate

seed-insert:
	cd $(APP_DIR) && bun run --filter @web-speed-hackathon-2026/server seed:insert

db-reset: seed-generate
	cd $(APP_DIR) && bun run --filter @web-speed-hackathon-2026/server seed:insert

.PHONY: playwright-install e2e-test e2e-core e2e-auth e2e-post e2e-dm e2e-crok e2e-full e2e-update \
	e2e-home e2e-search e2e-post-detail e2e-terms e2e-responsive \
	e2e-auth-auth-modal e2e-user-profile \
	e2e-posting e2e-dm-single e2e-crok-chat-single
playwright-install:
	cd $(APP_DIR)/e2e && bunx playwright install chromium

e2e-test:
	cd $(APP_DIR)/e2e && \
		$(if $(E2E_BASE_URL),E2E_BASE_URL=$(E2E_BASE_URL) ,)bunx playwright test $(E2E_SPEC) $(if $(E2E_GREP),--grep "$(E2E_GREP)",)

e2e-core:
	$(MAKE) e2e-home
	$(MAKE) e2e-search
	$(MAKE) e2e-post-detail
	$(MAKE) e2e-terms
	$(MAKE) e2e-responsive

e2e-auth:
	$(MAKE) e2e-auth-auth-modal
	$(MAKE) e2e-user-profile

e2e-post:
	$(MAKE) e2e-posting
	$(MAKE) e2e-post-detail

e2e-dm:
	$(MAKE) e2e-dm-single

e2e-crok:
	$(MAKE) e2e-crok-chat-single

# 以下は e2e の細かい分割ターゲット（テストファイル単位）
#
# 既存の大枠ターゲット（e2e-core/e2e-auth/e2e-post/...）は後方互換のため残し、
# これらの小分けターゲットを呼ぶようにしています。
e2e-home:
	$(MAKE) e2e-test E2E_SPEC="src/home.test.ts"

e2e-search:
	$(MAKE) e2e-test E2E_SPEC="src/search.test.ts"

e2e-post-detail:
	$(MAKE) e2e-test E2E_SPEC="src/post-detail.test.ts"

e2e-terms:
	$(MAKE) e2e-test E2E_SPEC="src/terms.test.ts"

e2e-responsive:
	$(MAKE) e2e-test E2E_SPEC="src/responsive.test.ts"

e2e-auth-auth-modal:
	$(MAKE) e2e-test E2E_SPEC="src/auth.test.ts"

e2e-user-profile:
	$(MAKE) e2e-test E2E_SPEC="src/user-profile.test.ts"

e2e-posting:
	$(MAKE) e2e-test E2E_SPEC="src/posting.test.ts"

e2e-dm-single:
	$(MAKE) e2e-test E2E_SPEC="src/dm.test.ts"

e2e-crok-chat-single:
	$(MAKE) e2e-test E2E_SPEC="src/crok-chat.test.ts"

e2e-full:
	$(MAKE) e2e-test

e2e-update:
	cd $(APP_DIR)/e2e && bunx playwright test --update-snapshots

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
