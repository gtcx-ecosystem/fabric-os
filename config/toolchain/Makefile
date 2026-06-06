# GTCX ecosystem Makefile — SoR: config/toolchain/Makefile
# Root copy: pnpm config:stubs:sync — edit here, not at repo root.

.DEFAULT_GOAL := help
ECOSYSTEM_MAKEFILE := config/toolchain/Makefile

.PHONY: help install test build lint check stubs agent-sync

help: ## Show common targets
	@grep -E '^[a-zA-Z_.-]+:.*?## .*$$' $(ECOSYSTEM_MAKEFILE) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies (pnpm)
	pnpm install

test: ## Run test suite (turbo)
	pnpm test

build: ## Build all packages (turbo)
	pnpm run build

lint: ## Lint (when package.json defines lint)
	pnpm run lint

check: ## Ops + root stub gates
	pnpm ops:check
	pnpm config:stubs:check

stubs: ## Sync root toolchain stubs from config/
	pnpm config:stubs:sync

agent-sync: ## Regenerate agent instruction targets
	pnpm agent:sync

# Optional repo-specific targets — maintainer-owned, not synced
-include Makefile.local
