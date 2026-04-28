#!/usr/bin/env node

/**
 * @fileoverview CLI tool that spawns a dev server command, monitors its log
 * output for a "ready" signal, and automatically opens the local URL in the
 * browser. If an error is detected first, it opens an AI assistant with the
 * error context for troubleshooting.
 */

import fsPromises from "fs/promises";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import opener from "opener";
import minimist from "minimist";
import waitOn from "wait-on";

const argv = minimist(process.argv.slice(2));
const cmdArgs = argv._;
const aiBase = argv["ai-base"] || "https://perplexity.ai?q=";
const noAi = argv.noAi || argv.noai || argv.ai === false;
const noOpen = argv.noOpen || argv.noopen || false;
const maxErrorContextChars = 1000;
const pollDelay = argv.pollDelay || 1200;

const nextDir = path.join(".", ".next");
const logPath = fs.existsSync(nextDir)
  ? path.join(".next", "port.log")
  : "open-when-ready.log";


/**
 * Scans log output for error lines and extracts surrounding context
 * as a URL-encoded string suitable for an AI search query.
 * @param {string} log - Raw log output from the dev server
 * @returns {string} URL-encoded error context, or empty string if no error found
 */
function getErrorContext(log) {
  const lines = log.split(/\n/);
  const errorRegex = /⨯|[Ss]yntax[Ee]rror|error|failed|exception/i;
  for (let i = 0; i < lines.length; i++) {
    if (errorRegex.test(lines[i])) {
      const context = lines
        .slice(Math.max(0, i - 5), i + 16)
        .slice(0, 25)
        .join(" ")
        .replace(/[^\w\s:./\\-]/g, "")
        .trim()
        .replace(/\s{2,}/g, " ")
        .slice(0, maxErrorContextChars)
        .replace(/ /g, "%20");
      return context;
    }
  }
  return "";
}

/**
 * Parses log output to find the local dev server URL (e.g. http://localhost:3000).
 * @param {string} log - Raw log output from the dev server
 * @returns {string|null} The localhost URL, or null if not found
 */
function extractUrl(log) {
  // Better regex for Local: line
  const localMatch = log.match(/Local:\s+(http:\/\/localhost:\d+)/i);
  if (localMatch) return localMatch[1];

  // Fallback port
  const portMatch = log.match(/localhost:(\d+)/);
  if (portMatch) return `http://localhost:${portMatch[1]}`;

  return null;
}

/**
 * Main entry point. Spawns the dev server command, pipes its output to a log
 * file, and polls the log for ready/error signals to open the browser or AI helper.
 */
async function run() {
  try {
    await fsPromises.rm(logPath, { force: true });
  } catch {}

  const proc = spawn(cmdArgs.join(" "), [], {
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    shell: true,
    detached: true,
  });

  const logStream = fs.createWriteStream(logPath);
  proc.stdout?.pipe(process.stdout);
  proc.stdout?.pipe(logStream);
  proc.stderr?.pipe(process.stderr);
  proc.stderr?.pipe(logStream);

  let opened = false;
  let errorOpened = false;
  let lastReadySeen = false;
  let lastLogSize = 0;
  let stableCount = 0;

  const poll = setInterval(async () => {
    try {
      const stats = fs.statSync(logPath);
      const currentLog = await fsPromises.readFile(logPath, "utf8");

      // Stability check LAST - check ready first!
      const logChanged = stats.size !== lastLogSize;
      if (logChanged && stats.size > 100) {
        stableCount = 0;
        lastLogSize = stats.size;
      } else if (stats.size > 100) {
        stableCount++;
        if (stableCount >= 5) {
          clearInterval(poll);
          return;
        }
      }

      // Error first
      const errorRegex = /⨯|[Ss]yntax[Ee]rror|error|failed|exception/i;
      if (errorRegex.test(currentLog) && !noAi && !errorOpened) {
        const err = getErrorContext(currentLog);
        const customPrompt = "Explain what the error is, how to fix it, then give a shell script with the best recommended solution.";
        const prompt = encodeURIComponent(customPrompt + " ");
        opener(`${aiBase}${prompt}next.js+${err}`);
        errorOpened = true;
        return;
      }

      // Ready check BEFORE stability stops us - with transition guard
      const readyRegex = /(?:ready[\s-]*started server|Ready in \d+ms)/i;
      const isReadyNow = readyRegex.test(currentLog);
      if (isReadyNow && !lastReadySeen && !opened) {
        opened = true;
        lastReadySeen = true;
        const url = extractUrl(currentLog);
        if (url && !noOpen) {
          try {
            await waitOn(url, { timeout: 10000, http: true });
          } catch {}
          opener(url);
        }
        clearInterval(poll);
        return;
      }
      lastReadySeen = isReadyNow;
    } catch {}
  }, pollDelay);

  process.on("SIGINT", () => {
    clearInterval(poll);
    process.exit(0);
  });
}

run().catch(console.error);
