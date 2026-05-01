# Deployment Guide

This guide covers deploying both the SMS Verification API and documentation to Cloudflare.

## Prerequisites

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Set up your Cloudflare account and get your Account ID from the dashboard.

## Environment Setup

### 1. Set Secrets (Required)

Set the following secrets using wrangler:

```bash
# For the main API
wrangler secret put AWS_ACCESS_KEY_ID
wrangler secret put AWS_SECRET_ACCESS_KEY
wrangler secret put API_KEY

# For staging environment
wrangler secret put AWS_ACCESS_KEY_ID --env staging
wrangler secret put AWS_SECRET_ACCESS_KEY --env staging
wrangler secret put API_KEY --env staging

# For production environment
wrangler secret put AWS_ACCESS_KEY_ID --env production
wrangler secret put AWS_SECRET_ACCESS_KEY --env production
wrangler secret put API_KEY --env production
```

### 2. Update wrangler.toml

Make sure your `wrangler.toml` has the correct account ID and zone ID if needed.

## Deployment Commands

### Deploy API Only

```bash
# Deploy to default environment
npm run deploy

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

### Deploy Docs Only

```bash
# Build docs first
npm run build:docs

# Deploy to default environment
npm run deploy:docs

# Deploy to staging
npm run deploy:docs:staging

# Deploy to production
npm run deploy:docs:production
```

### Deploy Both API and Docs

```bash
# Deploy both to default environment
npm run deploy:all

# Deploy both to staging
npm run deploy:all:staging

# Deploy both to production
npm run deploy:all:production
```

## Manual Deployment Steps

### 1. Deploy API (Workers)

```bash
# From project root
wrangler deploy
wrangler deploy --env staging
wrangler deploy --env production
```

### 2. Deploy Docs (Static Site)

```bash
# From docs directory
cd docs
npm run build
wrangler deploy
```

## Environment Variables

The following environment variables are automatically set:

- `ENVIRONMENT`: Set to "staging" or "production" based on deployment target
- `NODE_ENV`: Set to "production" for docs

## Troubleshooting

### Common Issues

1. **Authentication Error**: Run `wrangler login` again
2. **Build Failures**: Ensure all dependencies are installed with `npm install`
3. **Secret Errors**: Verify all secrets are set using `wrangler secret list`

### Checking Deployment Status

```bash
# Check Workers deployment
wrangler deployments list

# Check static site deployment
wrangler deployments list
```

## Monitoring

- **Workers**: Check Cloudflare Workers dashboard for API performance
- **Pages**: Check Cloudflare Pages dashboard for docs deployment status
- **Logs**: Use `wrangler tail` to monitor real-time logs

## Rollback

To rollback to a previous deployment:

```bash
# For Workers
wrangler rollback [deployment-id]

# For static site
wrangler rollback [deployment-id]
```
