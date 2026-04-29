import { Container } from "@cloudflare/containers";
import { authenticate } from "./auth";

// ─── Env ─────────────────────────────────────────────────────────────────────

export interface Env {
  CODE_SERVER: DurableObjectNamespace;

  // ── Cloudflare Access (production) ───────────────────────────────────────
  /** e.g. https://yourteam.cloudflareaccess.com  —  set via wrangler var */
  TEAM_DOMAIN?: string;
  /** Application Audience tag from the Access dashboard — set via wrangler var */
  POLICY_AUD?: string;

  // ── Container behaviour ───────────────────────────────────────────────────
  /** How long to keep container alive after last request. Default: 30m */
  SLEEP_AFTER: string;

  // ── R2 workspace storage ─────────────────────────────────────────────────
  /** R2 bucket binding — used only to verify the bucket exists at deploy time */
  WORKSPACE_BUCKET: R2Bucket;
  /** R2 API token access key (wrangler secret) — passed to container for FUSE mount */
  R2_ACCESS_KEY_ID?: string;
  /** R2 API token secret key (wrangler secret) — passed to container for FUSE mount */
  R2_SECRET_ACCESS_KEY?: string;
  /** Cloudflare account ID (wrangler secret) — needed for the R2 S3-compat endpoint */
  R2_ACCOUNT_ID?: string;
  /** R2 bucket name (wrangler var) */
  R2_BUCKET_NAME: string;
}

// ─── Container / Durable Object ──────────────────────────────────────────────

/**
 * One CodeServerContainer instance = one isolated code-server per user.
 *
 * Responsibilities:
 *  - Generate and persist a unique password for this user in SQLite.
 *  - Inject that password as an env var every time the container starts.
 *  - Expose an internal RPC endpoint so the Worker can retrieve the password
 *    to show it on the user's first-visit page.
 *  - Forward all other requests straight to code-server.
 */
export class CodeServerContainer extends Container<Env> {
  defaultPort = 8080;

  // Persisted in SQLite on first call from the Worker; used to build the per-user R2 prefix.
  private get userId(): string {
    const rows = [...this.ctx.storage.sql.exec(
      "SELECT value FROM user_config WHERE key = 'user_id'"
    )];
    return rows.length > 0 ? (rows[0].value as string) : "";
  }

  private setUserId(id: string): void {
    this.ctx.storage.sql.exec(`
      INSERT INTO user_config (key, value) VALUES ('user_id', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `, id);
  }

  constructor(ctx: DurableObjectState<unknown>, env: Env) {
    super(ctx as DurableObjectState<{}>, env);
    this.sleepAfter = env.SLEEP_AFTER ?? "30m";
  }

  /**
   * Initialise the SQLite schema once, then return (or generate) the
   * per-user password.  Idempotent — safe to call on every request.
   */
  private getOrCreatePassword(): string {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS user_config (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    const rows = [
      ...this.ctx.storage.sql.exec(
        "SELECT value FROM user_config WHERE key = 'password'"
      ),
    ];

    if (rows.length > 0) {
      return rows[0].value as string;
    }

    // First boot for this user — use the default password
    const password = "pass123";
    this.ctx.storage.sql.exec(
      "INSERT INTO user_config (key, value) VALUES ('password', ?)",
      password
    );
    return password;
  }

  override onStart(): void {
    console.log(`[code-server] Container started — DO id: ${this.ctx.id}`);
  }

  override onStop(_: { exitCode: number; reason: string }): void {
    console.log(`[code-server] Container stopped — DO id: ${this.ctx.id}`);
  }

  override onError(error: unknown): void {
    console.error(`[code-server] Container error:`, error);
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Internal RPC: Worker registers the userId for this DO (called on every proxy request)
    if (url.pathname === "/__internal/init" && request.method === "POST") {
      const { userId } = (await request.json()) as { userId: string };
      this.setUserId(userId);
      return Response.json({ ok: true });
    }

    // Internal RPC: Worker asks for the current password
    if (url.pathname === "/__internal/password") {
      const password = this.getOrCreatePassword();
      return Response.json({ password });
    }

    // Internal RPC: reset password
    if (url.pathname === "/__internal/reset-password" && request.method === "POST") {
      this.ctx.storage.sql.exec("DELETE FROM user_config WHERE key = 'password'");
      try { await this.stop(); } catch { /* already stopped */ }
      return Response.json({ ok: true });
    }

    // Inject password + R2 credentials before the container starts.
    // USER_ID drives the per-user R2 prefix: users/{userId}/
    const password = this.getOrCreatePassword();
    this.envVars = {
      PASSWORD: password,
      R2_ACCESS_KEY_ID: this.env.R2_ACCESS_KEY_ID ?? "",
      R2_SECRET_ACCESS_KEY: this.env.R2_SECRET_ACCESS_KEY ?? "",
      R2_ACCOUNT_ID: this.env.R2_ACCOUNT_ID ?? "",
      R2_BUCKET_NAME: this.env.R2_BUCKET_NAME ?? "",
      USER_ID: this.userId,
    };

    // Proxy to code-server via Container base class
    return super.fetch(request);
  }
}

// ─── Worker entry point ───────────────────────────────────────────────────────

function firstVisitPage(email: string, password: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>code-server — your password</title>
  <style>
    body{font-family:system-ui,sans-serif;background:#0d1117;color:#e6edf3;
         display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .card{background:#161b22;border:1px solid #30363d;border-radius:12px;
          padding:2rem 2.5rem;max-width:460px;width:100%}
    h1{margin:0 0 .25rem;font-size:1.25rem}
    p{color:#8b949e;margin:0 0 1.5rem;font-size:.9rem}
    .label{font-size:.75rem;color:#8b949e;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.4rem}
    .pw{font-family:monospace;font-size:1.15rem;background:#0d1117;border:1px solid #30363d;
        border-radius:6px;padding:.6rem 1rem;letter-spacing:.1em;color:#58a6ff;user-select:all}
    .note{margin-top:1.25rem;font-size:.82rem;color:#8b949e}
    .btn{display:inline-block;margin-top:1.5rem;background:#238636;color:#fff;border-radius:6px;
         padding:.55rem 1.25rem;text-decoration:none;font-size:.9rem}
    .btn:hover{background:#2ea043}
  </style>
</head>
<body>
  <div class="card">
    <h1>Your cloud IDE is starting 🚀</h1>
    <p>Signed in as <strong>${email}</strong></p>
    <div class="label">Your unique password</div>
    <div class="pw" id="pw">${password}</div>
    <p class="note">
      This password is unique to you and stored securely — it never changes unless
      you request a reset at <code>/reset-password</code>.
      Copy it before clicking below.
    </p>
    <a class="btn" href="/" onclick="navigator.clipboard?.writeText('${password}')">
      Copy &amp; open code-server →
    </a>
  </div>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ── Health check (unauthenticated) ──────────────────────────────────
    if (url.pathname === "/health") {
      return Response.json({ status: "ok", ts: Date.now() });
    }

    // ── Authenticate via Cloudflare Access JWT (or dev header) ──────────
    const authResult = await authenticate(request, env);
    if (authResult instanceof Response) return authResult; // 403

    const { email, userId } = authResult;

    // ── Route to the user's personal container instance ─────────────────
    const stub = env.CODE_SERVER.getByName(userId) as any;

    // Register the userId in the DO's SQLite so it can build the R2 prefix.
    // This is a cheap no-op after the first call (ON CONFLICT DO UPDATE).
    await stub.fetch(
      new Request("http://internal/__internal/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
    );

    // ── /setup — first-visit password reveal page ────────────────────────
    if (url.pathname === "/setup") {
      const pwResp = await stub.fetch(
        new Request("http://internal/__internal/password")
      );
      const { password } = (await pwResp.json()) as { password: string };
      return firstVisitPage(email, password);
    }

    // ── /reset-password — regenerate the password (POST only) ───────────
    if (url.pathname === "/reset-password" && request.method === "POST") {
      // Destroy the existing container so it reboots with the new password.
      // The simplest approach: call an internal endpoint that clears the DB row.
      await stub.fetch(
        new Request("http://internal/__internal/reset-password", {
          method: "POST",
        })
      );
      return Response.redirect(new URL("/setup", url).toString(), 303);
    }

    // ── Proxy everything else to code-server ─────────────────────────────
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;
