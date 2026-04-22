.PHONY: help up down logs status build restart deploy backup

SHELL := /bin/bash

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

up: ## Start all services
	docker compose up -d --build

down: ## Stop all services
	docker compose down

logs: ## Tail all logs
	docker compose logs -f

logs-app: ## Tail app logs only
	docker compose logs -f app

status: ## Show service status + health
	@docker compose ps
	@echo ""
	@echo -n "  App: "
	@curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3001/api/health 2>/dev/null || echo "not reachable"

build: ## Rebuild (no cache)
	docker compose build --no-cache

restart: ## Restart all services
	docker compose restart

deploy: ## Pull, rebuild, restart
	git pull --ff-only
	docker compose up -d --build

db-push: ## Push Drizzle schema to database
	docker compose exec app npx drizzle-kit push

db-seed: ## Seed the database
	docker compose exec app npx tsx scripts/seed.ts

db-seed-content: ## Seed content pages
	docker compose exec app npx tsx scripts/seed-content.ts

backup: ## Backup database
	@mkdir -p backups
	@TS=$$(date +%Y%m%d_%H%M%S) && \
	docker compose exec -T db pg_dump -U $${POSTGRES_USER:-downair} $${POSTGRES_DB:-downair} | gzip > backups/db-$$TS.sql.gz && \
	echo "Backup saved to backups/db-$$TS.sql.gz"
