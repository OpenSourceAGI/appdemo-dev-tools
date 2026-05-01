---
title: API Authentication
---

This SMS Verification API requires authentication using an API key for all endpoints except:
- `/health` - Health check endpoint
- `/` - Swagger UI documentation (root path)
- `/openapi.json` - OpenAPI specification

## API Key

Your API key is: `sk_test_1234567890abcdef1234567890abcdef`

## Authentication Methods

You can provide your API key in one of two ways:

### Method 1: X-API-Key Header (Recommended)
```bash
curl -X POST https://your-worker.workers.dev/api/send-verification \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_test_1234567890abcdef1234567890abcdef" \
  -d '{"phoneNumber": "+1234567890"}'
```

### Method 2: Authorization Header (Bearer Token)
```bash
curl -X POST https://your-worker.workers.dev/api/send-verification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_test_1234567890abcdef1234567890abcdef" \
  -d '{"phoneNumber": "+1234567890"}'
```

## JavaScript/Node.js Examples

### Using X-API-Key Header
```javascript
const response = await fetch('https://your-worker.workers.dev/api/send-verification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sk_test_1234567890abcdef1234567890abcdef'
  },
  body: JSON.stringify({
    phoneNumber: '+1234567890'
  })
});
```

### Using Authorization Header
```javascript
const response = await fetch('https://your-worker.workers.dev/api/send-verification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk_test_1234567890abcdef1234567890abcdef'
  },
  body: JSON.stringify({
    phoneNumber: '+1234567890'
  })
});
```

## Error Responses

### Missing API Key (401 Unauthorized)
```json
{
  "error": "API key required",
  "message": "Please provide your API key in the Authorization header (Bearer token) or X-API-Key header"
}
```

### Invalid API Key (401 Unauthorized)
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is invalid"
}
```

## Security Notes

- Keep your API key secure and do not share it publicly
- The API key is stored as a secret in Cloudflare Workers
- All API requests should be made over HTTPS
- Consider rotating your API key periodically for enhanced security

## Testing

You can test the API using the Swagger UI at the root path `/`, which will prompt you to enter your API key in the "Authorize" section. 