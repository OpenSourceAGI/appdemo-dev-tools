#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer.trim());
  }));
}

function run(cmd, { ignoreError = false } = {}) {
  try {
    console.log(`\n$ ${cmd}`);
    return execSync(cmd, { encoding: "utf8", stdio: ["inherit", "pipe", "pipe"] }).trim();
  } catch (e) {
    if (ignoreError) return (e.stdout || e.stderr || "").toString();
    throw e;
  }
}

// Simple login check via `turso auth token`
function isLoggedIn() {
  const out = run("turso auth token", { ignoreError: true }); // errors if not logged in [web:72][web:74]
  const text = String(out || "");
  if (!text) return false;
  if (text.includes("You are not logged in, please login with turso auth login")) return false;
  return true;
}

async function ensureLogin() {
  if (isLoggedIn()) return;
  console.error(
    "\nYou are not logged in. Please run `turso auth login` (or `turso auth login --headless`) and try again.\n"
  );
  const answer = await ask("Run `turso auth login` now? (y/N): ");
  if (!/^y(es)?$/i.test(answer)) process.exit(1);

  try {
    run("turso auth login");
  } catch {
    console.error("Login failed. Please complete `turso auth login` manually and rerun this command.");
    process.exit(1);
  }

  if (!isLoggedIn()) {
    console.error("Still not logged in after `turso auth login`. Exiting.");
    process.exit(1);
  }
}

// Parse env file into array of line objects to preserve comments/whitespace
function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  return lines.map((line) => {
    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      return { type: 'blank', line };
    }

    // Comment line
    if (trimmed.startsWith("#")) {
      return { type: 'comment', line };
    }

    // Key-value pair
    const idx = trimmed.indexOf("=");
    if (idx === -1) {
      return { type: 'other', line };
    }

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();

    // Remove quotes from value if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    return { type: 'keyvalue', key, value, line };
  });
}

// Write env array back to file, preserving comments and blank lines
function writeEnvFile(filePath, lineArray, updates) {
  const updatedLines = lineArray.map((item) => {
    // If this is a key-value pair and we have an update for it
    if (item.type === 'keyvalue' && updates[item.key] !== undefined) {
      return `${item.key}=${updates[item.key]}`;
    }
    // Otherwise, preserve the original line
    return item.line;
  });

  // Add any new keys that weren't in the original file
  const existingKeys = new Set(
    lineArray.filter(item => item.type === 'keyvalue').map(item => item.key)
  );

  for (const [key, value] of Object.entries(updates)) {
    if (!existingKeys.has(key)) {
      updatedLines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(filePath, updatedLines.join("\n") + "\n");
}

async function main() {
  await ensureLogin();

  // DB name from argv or prompt
  let dbName = process.argv[2];
  if (!dbName) {
    dbName = await ask("Enter Turso database name: ");
  }
  if (!dbName) {
    console.error("Database name is required. Exiting.");
    process.exit(1);
  }

  // Load existing .env into line array
  const envPath = path.join(process.cwd(), ".env");
  const envLines = readEnvFile(envPath);

  // Extract current values from line array
  const envObj = {};
  envLines.forEach(item => {
    if (item.type === 'keyvalue') {
      envObj[item.key] = item.value;
    }
  });

  const existingUrl = envObj.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const existingToken = envObj.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

  if (existingUrl || existingToken) {
    console.log("\nExisting Turso env values detected in .env or process env:");
    if (existingUrl) console.log(`- TURSO_DATABASE_URL: ${existingUrl}`);
    if (existingToken) console.log(`- TURSO_AUTH_TOKEN: ${existingToken}`);
    const answer = await ask(
      "Overwrite existing TURSO_DATABASE_URL and TURSO_AUTH_TOKEN? (y/N): "
    );
    if (!/^y(es)?$/i.test(answer)) {
      console.log("Keeping existing Turso env values. Exiting.");
      process.exit(0);
    }
  }

  // Ensure DB exists
  try {
    run(`turso db create ${dbName}`);
  } catch (e) {
    console.warn(`turso db create ${dbName} failed (may already exist): ${e.message}`);
  }

  // Get URL & token
  const dbUrl = run(`turso db show ${dbName} --url`);        // libsql URL [web:24]
  const authToken = run(`turso db tokens create ${dbName}`); // token as text [web:1][web:45]

  // Put into env object and process.env
  envObj.TURSO_DATABASE_URL = dbUrl;
  envObj.TURSO_AUTH_TOKEN = authToken;
  process.env.TURSO_DATABASE_URL = dbUrl;
  process.env.TURSO_AUTH_TOKEN = authToken;

  // Overwrite .env with updated values (no duplicates, no stale "not logged in" values)
  writeEnvFile(envPath, envLines, envObj);

  console.log("\nUpdated Turso environment variables (overwritten in .env):");
  console.log(`TURSO_DATABASE_URL=${process.env.TURSO_DATABASE_URL}`);
  console.log(`TURSO_AUTH_TOKEN=${process.env.TURSO_AUTH_TOKEN}`);
  console.log(`\nWrote updated values to ${envPath}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});