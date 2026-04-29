# cf-code-server

Per-user [code-server](https://github.com/coder/code-server) instances on Cloudflare Containers, protected by Cloudflare Access, with automatic per-user passwords stored in Durable Object SQLite.

## Architecture

```
Browser → Cloudflare Access (SSO) → Worker → Durable Object → Container (code-server)
                                                    ↕
                                              SQLite (password)
```

- **One Durable Object per user** — named by their sanitised Access email.
- **One Container per Durable Object** — each user gets a fully isolated VS Code environment.
- **Per-user passwords** — generated with the Web Crypto API on first boot, stored in the DO's SQLite database. Never shared, never in env vars.
- **Cloudflare Access JWT validation** — the Worker validates the `Cf-Access-Jwt-Assertion` header using JWKS from your team domain.

## Quick start

### 1. Install and deploy (dev mode, no Access)

```bash
npm install
wrangler login
wrangler deploy
```

In dev mode (`TEAM_DOMAIN` and `POLICY_AUD` left empty), auth falls back to the `x-user-id` header or `?user=` query param. This is safe for local testing only.

### 2. Visit your password setup page

```
https://cf-code-server.<your-subdomain>.workers.dev/setup?user=alice
```

Copy the generated password, then click **Open code-server**.

---

## Production setup with Cloudflare Access

### Step 1 — Create an Access application

1. [Cloudflare One](https://one.dash.cloudflare.com/) → **Access controls** → **Applications** → **Add an application** → **Self-hosted**
2. Set the **Application domain** to your Worker's route (e.g. `code.example.com`)
3. Add an **Allow policy** (e.g. emails ending in `@yourcompany.com`)
4. From the **Basic information** tab, copy the **Application Audience (AUD) Tag**

### Step 2 — Set environment variables

Edit `wrangler.jsonc` and fill in:

```jsonc
"vars": {
  "TEAM_DOMAIN": "https://yourteam.cloudflareaccess.com",
  "POLICY_AUD":  "your-aud-tag-here",
  "SLEEP_AFTER": "30m"
}
```

Or use secrets for sensitive values:

```bash
wrangler secret put TEAM_DOMAIN
wrangler secret put POLICY_AUD
```

### Step 3 — Deploy

```bash
wrangler deploy
```

### Step 4 — Direct users to /setup on first login

Add a redirect rule or inform users: visit `/setup` once to see their password. After that, code-server maintains its own session cookie.

---

## Endpoints

| Path | Auth | Description |
|------|------|-------------|
| `GET /health` | None | Uptime check |
| `GET /setup` | Access | Shows the user's unique password |
| `POST /reset-password` | Access | Generates a new password and reboots the container |
| `GET /*` | Access | Proxied to the user's code-server instance |

---

## Resetting a user's password

Users can reset their own password:

```bash
curl -X POST https://code.example.com/reset-password \
  -H "Cf-Access-Jwt-Assertion: <their-token>"
```

This:
1. Deletes the stored password from their DO's SQLite database
2. Stops their running container
3. Redirects to `/setup` where the new password is displayed
4. On next request, a new password is generated and the container restarts

---

## Configuration reference

| Variable | Where | Default | Description |
|----------|-------|---------|-------------|
| `TEAM_DOMAIN` | `wrangler.jsonc` vars or secret | `""` | Your Cloudflare Access team URL |
| `POLICY_AUD` | `wrangler.jsonc` vars or secret | `""` | Access application AUD tag |
| `SLEEP_AFTER` | `wrangler.jsonc` vars | `"30m"` | Container idle timeout |

Container sizing is set in `wrangler.jsonc` under `containers[].instance_type`:

| Type | vCPU | RAM | Use case |
|------|------|-----|---------|
| `lite` | 0.25 | 256 MB | Not suitable for code-server |
| `basic` | 0.5 | 512 MB | Light use only |
| `standard-1` | 1 | 2 GB | Default — works well |
| `standard-2` | 2 | 4 GB | Heavier projects |

---

## Local development

```bash
# Dev server (simulates Workers runtime, no real containers)
npm run dev

# Type-check only
npm run build
```

In `wrangler dev`, Cloudflare Access validation is skipped automatically when `TEAM_DOMAIN` is empty. Use `?user=yourname` to switch between simulated users.
