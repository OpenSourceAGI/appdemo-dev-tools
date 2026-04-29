#!/bin/bash
set -e

WORKSPACE="/home/coder/workspace"

# ── R2 FUSE mount ─────────────────────────────────────────────────────────────
# All four R2 vars must be present for the mount to proceed.
# USER_ID is the sanitised email slug used as the per-user bucket prefix.
if [[ -n "$R2_ACCESS_KEY_ID" && -n "$R2_SECRET_ACCESS_KEY" && \
      -n "$R2_ACCOUNT_ID"    && -n "$R2_BUCKET_NAME" ]]; then

  # geesefs reads credentials from the AWS shared-credentials format
  mkdir -p "$HOME/.aws"
  cat > "$HOME/.aws/credentials" <<CREDS
[default]
aws_access_key_id=${R2_ACCESS_KEY_ID}
aws_secret_access_key=${R2_SECRET_ACCESS_KEY}
CREDS

  # Per-user prefix: users/<userId>/ — keeps every workspace isolated in the bucket
  PREFIX="users/${USER_ID:-default}"

  echo "[entrypoint] Mounting R2 bucket '${R2_BUCKET_NAME}' at ${WORKSPACE} (prefix: ${PREFIX})"

  geesefs \
    --endpoint "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    --subdomain \
    --cache /tmp/geesefs-cache \
    --dir-mode 0755 \
    --file-mode 0644 \
    --uid "$(id -u)" \
    --gid "$(id -g)" \
    -o allow_other \
    "${R2_BUCKET_NAME}:${PREFIX}" \
    "${WORKSPACE}"

  echo "[entrypoint] R2 mount ready — live sync active"
else
  echo "[entrypoint] R2 credentials not set — using local ephemeral workspace"
fi

# ── Start code-server ─────────────────────────────────────────────────────────
# PASSWORD is injected by the Durable Object via envVars before container start
exec /usr/bin/entrypoint.sh --bind-addr 0.0.0.0:8080 --auth password "${WORKSPACE}"
