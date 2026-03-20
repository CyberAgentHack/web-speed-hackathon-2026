.PHONY: help install build start typecheck format \
	e2e-install e2e-test e2e-update analyze \
	score-install score score-target

E2E_FILTER := @web-speed-hackathon-2026/e2e
SCORE_DIR := ../scoring-tool
APPLICATION_URL ?= http://localhost:3000
TARGET_NAME ?=

help:
	@printf '%s\n' \
		'make install       - application の依存をインストール' \
		'make build         - client をビルド' \
		'make start         - server を起動' \
		'make typecheck     - workspace 全体を型チェック' \
		'make format        - oxlint/oxfmt を実行' \
		'make e2e-install   - Playwright 用 Chromium をインストール' \
		'make e2e-test      - E2E/VRT を実行' \
		'make e2e-update    - VRT スナップショットを更新' \
		'make analyze       - webpack analyzer 付きでビルド' \
		'make score-install - scoring-tool の依存をインストール' \
		'make score         - scoring-tool で計測' \
		'make score-target  - TARGET_NAME を指定して計測'

install:
	pnpm install --frozen-lockfile

build:
	pnpm run build

start:
	pnpm run start

typecheck:
	pnpm run typecheck

format:
	pnpm run format

e2e-install:
	pnpm --filter "$(E2E_FILTER)" exec playwright install chromium

e2e-test:
	pnpm --filter "$(E2E_FILTER)" run test

e2e-update:
	pnpm --filter "$(E2E_FILTER)" run test:update

analyze:
	ANALYZE=1 pnpm run build

score-install:
	cd "$(SCORE_DIR)" && pnpm install --frozen-lockfile

score:
	cd "$(SCORE_DIR)" && pnpm start --applicationUrl "$(APPLICATION_URL)"

score-target:
	cd "$(SCORE_DIR)" && pnpm start --applicationUrl "$(APPLICATION_URL)" --targetName "$(TARGET_NAME)"
