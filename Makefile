.PHONY: dev up down build migrate lint test

## Inicia frontend e backend em modo desenvolvimento (sem Docker)
dev:
	npm run dev --workspace=apps/web & npm run dev --workspace=apps/api

## Sobe todos os serviços via Docker Compose (web + api + banco)
up:
	docker compose up -d

## Para todos os serviços Docker
down:
	docker compose down

## Gera build de produção (web + api)
build:
	npm run build --workspace=apps/web
	npm run build --workspace=apps/api

## Executa migrations do banco via drizzle-kit
migrate:
	npm run migrate --workspace=apps/api

## Executa ESLint em apps/web e apps/api
lint:
	npm run lint --workspace=apps/web
	npm run lint --workspace=apps/api

## Executa testes do backend (Vitest)
test:
	npm run test --workspace=apps/api
