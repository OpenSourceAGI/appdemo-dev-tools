#!/bin/bash

# Deployment script for SMS Verification API and Docs
# Usage: ./scripts/deploy.sh [environment] [component]

set -e

ENVIRONMENT=${1:-default}
COMPONENT=${2:-all}

echo "🚀 Starting deployment..."
echo "Environment: $ENVIRONMENT"
echo "Component: $COMPONENT"

# Function to deploy API
deploy_api() {
    echo "📡 Deploying API to $ENVIRONMENT..."
    if [ "$ENVIRONMENT" = "production" ]; then
        npm run deploy:production
    elif [ "$ENVIRONMENT" = "staging" ]; then
        npm run deploy:staging
    else
        npm run deploy
    fi
    echo "✅ API deployment completed!"
}

# Function to deploy docs
deploy_docs() {
    echo "📚 Building and deploying docs to $ENVIRONMENT..."
    bun run build:docs
    
    if [ "$ENVIRONMENT" = "production" ]; then
        cd docs && wrangler deploy --env production && cd ..
    elif [ "$ENVIRONMENT" = "staging" ]; then
        cd docs && wrangler deploy --env staging && cd ..
    else
        cd docs && wrangler deploy && cd ..
    fi
    echo "✅ Docs deployment completed!"
}

# Main deployment logic
case $COMPONENT in
    "api")
        deploy_api
        ;;
    "docs")
        deploy_docs
        ;;
    "all")
        deploy_api
        deploy_docs
        ;;
    *)
        echo "❌ Invalid component. Use: api, docs, or all"
        exit 1
        ;;
esac

echo "🎉 Deployment completed successfully!"
echo "Environment: $ENVIRONMENT"
echo "Component: $COMPONENT"
