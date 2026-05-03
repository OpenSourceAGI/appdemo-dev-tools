/**
 * Cloudflare Workers Queue Consumer
 * Fires a Claude Code routine when a Workers build fails.
 *
 * Event flow:
 *   CF Workers Builds → Queue → this Worker → Claude Code /fire endpoint
 */

const MAX_TEXT_BYTES = 65_536;

function truncate(s) {
  if (s.length <= MAX_TEXT_BYTES) return s;
  return (
    s.slice(0, MAX_TEXT_BYTES - 200) +
    "\n\n[... log truncated to fit 65,536-char limit ...]"
  );
}

function buildPayloadText(evt) {
  const lines = [
    `⚠️ Cloudflare Workers build FAILED`,
    `Worker : ${evt.worker_name}`,
    `Build  : ${evt.build_id}`,
    `Branch : ${evt.branch ?? "(unknown)"}`,
    `Commit : ${evt.commit_hash ?? "(unknown)"}`,
    `Author : ${evt.author ?? "(unknown)"}`,
    `Time   : ${evt.timestamp}`,
    ``,
    `=== Error log ===`,
  ];

  if (evt.error_messages && evt.error_messages.length > 0) {
    lines.push(...evt.error_messages);
  } else {
    lines.push(
      "(no structured error messages in event; check Logpush for full output)",
    );
  }

  return truncate(lines.join("\n"));
}

async function fireRoutine(text, env) {
  const res = await fetch(env.ROUTINE_FIRE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.ROUTINE_FIRE_TOKEN}`,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "experimental-cc-routine-2026-04-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Routine fire failed (${res.status}): ${body}`);
  }

  return res.json();
}

async function notifyWebhook(evt, sessionUrl, webhookUrl) {
  const text =
    `🤖 Claude Code is investigating the failed \`${evt.worker_name}\` build ` +
    `(branch: \`${evt.branch ?? "?"}\`, commit: \`${evt.commit_hash?.slice(0, 7) ?? "?"}\`).\n` +
    `👉 Live session: ${sessionUrl}`;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, content: text }), // works for both Slack and Discord
  });
}

export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      const evt = message.body;

      if (evt.status !== "failed") {
        message.ack();
        continue;
      }

      try {
        console.log(
          `[cloudflare-to-claude-fix] Build ${evt.build_id} for worker "${evt.worker_name}" failed — firing routine.`,
        );

        const text = buildPayloadText(evt);
        const { claude_code_session_url } = await fireRoutine(text, env);

        console.log(
          `[cloudflare-to-claude-fix] Routine fired. Session: ${claude_code_session_url}`,
        );

        if (env.NOTIFY_WEBHOOK_URL) {
          await notifyWebhook(
            evt,
            claude_code_session_url,
            env.NOTIFY_WEBHOOK_URL,
          );
        }

        message.ack();
      } catch (err) {
        console.error(
          `[cloudflare-to-claude-fix] Error processing build ${evt.build_id}:`,
          err,
        );
        message.retry();
      }
    }
  },
};
