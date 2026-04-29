import { jwtVerify, createRemoteJWKSet } from "jose";
import type { Env } from "./index";

export interface AuthUser {
  /** Stable user identity - email from the Access JWT */
  email: string;
  /** Safe filesystem/DO key derived from email */
  userId: string;
  /** Raw JWT payload for downstream use */
  sub: string;
}

/**
 * Sanitise an email into a safe Durable Object name and filesystem key.
 * e.g. "alexa@example.com" → "alexa_example_com"
 */
export function emailToUserId(email: string): string {
  return email
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .slice(0, 64);
}

/**
 * Validates the Cloudflare Access JWT from the incoming request.
 *
 * Returns the authenticated user, or a 403 Response if validation fails.
 * In development mode (no TEAM_DOMAIN set), falls back to x-user-id / ?user= for local testing.
 */
export async function authenticate(
  request: Request,
  env: Env
): Promise<AuthUser | Response> {
  // ── Dev mode: skip JWT when no team domain configured ───────────────────
  if (!env.TEAM_DOMAIN || !env.POLICY_AUD) {
    const rawId =
      request.headers.get("x-user-id") ??
      new URL(request.url).searchParams.get("user") ??
      "dev-user";
    const email = `${rawId}@dev.local`;
    return { email, userId: emailToUserId(email), sub: rawId };
  }

  // ── Production: validate Cloudflare Access JWT ───────────────────────────
  const token =
    request.headers.get("cf-access-jwt-assertion") ??
    getCookie(request, "CF_Authorization");

  if (!token) {
    return new Response("Unauthorized: missing Cloudflare Access token", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  try {
    const JWKS = createRemoteJWKSet(
      new URL(`${env.TEAM_DOMAIN}/cdn-cgi/access/certs`)
    );

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.TEAM_DOMAIN,
      audience: env.POLICY_AUD,
    });

    const email = (payload.email as string) ?? payload.sub ?? "unknown";
    return {
      email,
      userId: emailToUserId(email),
      sub: String(payload.sub ?? email),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Unauthorized: ${msg}`, {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
