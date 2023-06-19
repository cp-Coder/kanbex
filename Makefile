.PHONY: help
.DEFAULT_GOAL := help

# Help

.SILENT: help
help:
	@echo Usage: make [command]
	@echo Commands:
	@echo help												Show this help message
	@echo generate										Generates Prisma client
	@echo migrate --name							Migrate database
	@echo push												Push the schema to database
	@echo pull												Pull the schema from database
	@echo dev													Start development server

# Database

generate: # Generates Prisma client
	@echo Generating Prisma client...
	@pnpm prisma:generate

migrate: # Migrate database
	@echo Migrating database...
	@pnpx prisma migrate dev --name $(name)

push: # Push database
	@echo Pushing database...
	@pnpx prisma db push

pull: # Pull database
	@echo Pulling database...
	@pnpx prisma db pull

# Development

dev: # Start development server
	@echo Starting development server...
	@pnpm dev

# Docker

build: # Builds docker local service
	@echo Building services...
	@docker compose -f docker-compose.local.yml build

up: # Starts docker local service
	@echo Starting services...
	@docker compose -f docker-compose.local.yml up -d

down: # Stops docker local service
	@echo Stopping services...
	@docker compose -f docker-compose.local.yml down

logs: # Shows docker local service logs
	@echo Showing logs...
	@docker compose -f docker-compose.local.yml logs --follow