---
title: Cloudflare Workers Deployment Guide
---

This guide will help you deploy the SMS Verification API to Cloudflare Workers using Wrangler.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install Wrangler globally
   ```bash
   npm install -g wrangler
   ```
3. **AWS Account**: You'll need AWS credentials for SNS SMS sending

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Configure AWS Credentials
Set your AWS credentials as Cloudflare Workers secrets:
```bash
wrangler secret put AWS_ACCESS_KEY_ID
# Enter your AWS Access Key ID when prompted

wrangler secret put AWS_SECRET_ACCESS_KEY
# Enter your AWS Secret Access Key when prompted
```

### 4. Update Configuration
Edit `wrangler.toml` to match your Cloudflare account:
```toml
name = "your-sms-verification-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

[env.production]
name = "your-sms-verification-api"

[env.staging]
name = "your-sms-verification-api-staging"

[vars]
AWS_REGION = "us-east-1"
SMS_SENDER_ID = "YourApp"
```

### 5. Update Server URLs
In `src/index.js`, update the server URLs in the OpenAPI configuration:
```javascript
servers: [
  {
    url: 'https://your-sms-verification-api.your-subdomain.workers.dev',
    description: 'Production server',
  },
  {
    url: 'https://your-sms-verification-api-staging.your-subdomain.workers.dev',
    description: 'Staging server',
  },
],
```

## Development

### Local Development
```bash
npm run dev
```
This starts a local development server at `http://localhost:8787`

### Testing
```bash
npm run test
```

## Deployment

### Deploy to Staging
```bash
npm run deploy:staging
```

### Deploy to Production
```bash
npm run deploy:production
```

### Deploy to Default Environment
```bash
npm run deploy
```

## Environment Variables

### Required Secrets (set with `wrangler secret put`)
- `AWS_ACCESS_KEY_ID`: Your AWS Access Key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS Secret Access Key

### Optional Variables (set in wrangler.toml)
- `AWS_REGION`: AWS region (default: us-east-1)
- `SMS_SENDER_ID`: Sender ID for SMS messages (default: Verify)

## Production Considerations

### 1. Use Cloudflare KV for Storage
Replace in-memory storage with Cloudflare KV for production:

```javascript
// Add KV binding to wrangler.toml
[[kv_namespaces]]
binding = "VERIFICATION_CODES"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"

// Update storage in src/index.js
const verificationCodes = env.VERIFICATION_CODES;
```

### 2. Custom Domain
Add a custom domain in the Cloudflare dashboard and update your `wrangler.toml`:
```toml
[env.production]
name = "your-sms-verification-api"
routes = [
  { pattern = "api.yourdomain.com", zone_name = "yourdomain.com" }
]
```

### 3. Rate Limiting
Consider using Cloudflare's built-in rate limiting or implement more sophisticated rate limiting with KV storage.

## Monitoring

### Logs
View logs in the Cloudflare dashboard or using Wrangler:
```bash
wrangler tail
```

### Analytics
Monitor your API usage in the Cloudflare dashboard under Workers & Pages.

## Troubleshooting

### Common Issues

1. **CORS Errors**: The API is configured to allow all origins (`*`). Adjust in `src/index.js` if needed.

2. **AWS Credentials**: Ensure your AWS credentials have SNS SMS sending permissions.

3. **Memory Limits**: Cloudflare Workers have memory limits. The current implementation uses in-memory storage which resets on each request.

4. **Timeout Issues**: Workers have a 30-second timeout. Ensure your SNS requests complete within this time.

### Debug Mode
Enable debug logging by setting the log level in your Worker:
```javascript
app.use('*', logger({ level: 'debug' }));
```

## Security

- AWS credentials are stored as encrypted secrets
- CORS is configured for cross-origin requests
- Rate limiting is implemented to prevent abuse
- Input validation is performed on all endpoints

## Cost Optimization

- Cloudflare Workers are pay-per-request
- Monitor your usage in the Cloudflare dashboard
- Consider implementing caching for frequently accessed data
- Use KV storage efficiently to minimize read/write operations 