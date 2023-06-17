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