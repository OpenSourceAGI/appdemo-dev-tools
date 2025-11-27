#!/bin/bash

# Script to run database migrations in Docker environment
# Usage: ./scripts/docker-migrate.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}

echo "Running database migrations for environment: $ENVIRONMENT"

if [ "$ENVIRONMENT" = "prod" ]; then
    echo "Running production migrations..."
    docker-compose -f docker-compose.prod.yml exec app bun run drizzle:migrate:prod
elif [ "$ENVIRONMENT" = "dev" ]; then
    echo "Running development migrations..."
    docker-compose exec app bun run drizzle:migrate:dev
else
    echo "Invalid environment. Use 'dev' or 'prod'"
    exit 1
fi

echo "Migrations completed successfully!" 