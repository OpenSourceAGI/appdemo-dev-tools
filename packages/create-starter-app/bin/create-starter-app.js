#!/usr/bin/env node
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { existsSync, cpSync, readFileSync } from "fs";
import { createInterface } from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STARTERS_DIR = join(__dirname, "../../../starter-templates");

// ─── ANSI helpers ────────────────────────────────────────────────────────────
const c = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  cyan:    "\x1b[36m",
  green:   "\x1b[32m",
  yellow:  "\x1b[33m",
  blue:    "\x1b[34m",
  magenta: "\x1b[35m",
  red:     "\x1b[31m",
  white:   "\x1b[37m",
  bgBlue:  "\x1b[44m",
};
const bold    = (s) => `${c.bold}${s}${c.reset}`;
const dim     = (s) => `${c.dim}${s}${c.reset}`;
const cyan    = (s) => `${c.cyan}${s}${c.reset}`;
const green   = (s) => `${c.green}${s}${c.reset}`;
const yellow  = (s) => `${c.yellow}${s}${c.reset}`;
const blue    = (s) => `${c.blue}${s}${c.reset}`;
const magenta = (s) => `${c.magenta}${s}${c.reset}`;
const red     = (s) => `${c.red}${s}${c.reset}`;

// ─── Template metadata ───────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: "template-nextjs-betterauth-shadcn-drizzle",
    label: "Next.js + BetterAuth + Shadcn + Drizzle",
    color: blue,
    icon: "⚡",
    parts: [
      bold("Next.js 15")     + " — App Router with Turbopack dev server",
      bold("BetterAuth")     + " — Full-stack auth: OAuth, email/password, sessions",
      bold("Shadcn/UI")      + " — Radix-based accessible component library",
      bold("Drizzle ORM")    + " — Type-safe SQL schema & migrations (SQLite/Postgres)",
      bold("Stripe")         + " — Subscription billing via @better-auth/stripe plugin",
      bold("Biome")          + " — Fast lint + format (replaces ESLint + Prettier)",
      bold("TypeScript")     + " — Strict types throughout",
    ],
    devNotes: "Best for SaaS apps needing auth + payments + a lean ORM.",
  },
  {
    id: "template-nextjs-betterauth-shadcn-prisma",
    label: "Next.js + BetterAuth + Shadcn + Prisma",
    color: magenta,
    icon: "🔷",
    parts: [
      bold("Next.js 15")     + " — App Router, server actions, nested layouts",
      bold("BetterAuth")     + " — Session-based auth with social providers",
      bold("Shadcn/UI")      + " — Copy-paste component system with Radix primitives",
      bold("Prisma ORM")     + " — Schema-first ORM with auto-generated client & studio",
      bold("Server Actions") + " — Typed form mutations without manual API routes",
      bold("Context API")    + " — Lightweight global state for auth & theme",
      bold("TypeScript")     + " — Full-stack type safety",
    ],
    devNotes: "Best for teams comfortable with Prisma's schema-first workflow.",
  },
  {
    id: "template-svelte-betterauth-drizzle-shadcn",
    label: "SvelteKit + BetterAuth + Drizzle + Shadcn",
    color: yellow,
    icon: "🔥",
    parts: [
      bold("SvelteKit")            + " — File-based routing, SSR, load functions",
      bold("BetterAuth")           + " — Auth plugin with Svelte hooks integration",
      bold("Drizzle ORM")          + " — Lightweight SQL ORM with Zod schema validation",
      bold("bits-ui + Shadcn")     + " — Headless Svelte primitives styled with Tailwind",
      bold("Cloudflare Workers")   + " — Edge-ready adapter for global low-latency deploy",
      bold("Formsnap")             + " — Type-safe form bindings for SvelteKit",
      bold("Chrome Extension")     + " — @types/chrome included for extension support",
    ],
    devNotes: "Best for edge deployments or devs who prefer Svelte's reactive model.",
  },
  {
    id: "template-fumadocs",
    label: "Fumadocs — Next.js Documentation Site",
    color: cyan,
    icon: "📚",
    parts: [
      bold("Fumadocs")       + " — Modern docs framework built on Next.js App Router",
      bold("MDX content")    + " — Write docs in Markdown with embedded React components",
      bold("Orama search")   + " — Fast full-text client-side search with zero backend",
      bold("AI Ask mode")    + " — LLM-powered question answering over your docs",
      bold("OpenAPI page")   + " — Auto-render REST API reference from OpenAPI spec",
      bold("npm metadata")   + " — Live badge/stats route for npm package pages",
      bold("Radix UI")       + " — Accessible dialog, tooltip, collapsible primitives",
    ],
    devNotes: "Best for open-source libraries or products needing polished docs with search + AI.",
  },
  {
    id: "template-docusaurus",
    label: "Docusaurus — Classic Documentation Site",
    color: green,
    icon: "🦕",
    parts: [
      bold("Docusaurus 3")          + " — Meta's battle-tested static site docs framework",
      bold("Lunr search")           + " — Offline-capable full-text search, no Algolia needed",
      bold("OpenAPI docs plugin")   + " — Generate API reference pages from OpenAPI/Swagger",
      bold("Google Analytics")      + " — Built-in gtag plugin for traffic tracking",
      bold("TypeDoc")               + " — Auto-generate API docs from TypeScript source",
      bold("Tailwind CSS")          + " — Utility-first styling alongside Docusaurus themes",
      bold("Custom theme")          + " — Pre-configured dark/light CSS with no-effects variant",
    ],
    devNotes: "Best for established projects that want a stable, plugin-rich docs platform.",
  },
];

// ─── Interactive arrow-key menu ───────────────────────────────────────────────
function clearLines(n) {
  for (let i = 0; i < n; i++) process.stdout.write("\x1b[1A\x1b[2K");
}

function renderMenu(templates, selected) {
  const lines = [];
  lines.push("");
  lines.push(bold(cyan("  Select a starter template")) + dim("  (↑↓ arrows, Enter to confirm, q to quit)"));
  lines.push("");

  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    const isSelected = i === selected;
    const prefix = isSelected ? c.cyan + " ❯ " + c.reset : "   ";
    const label = isSelected ? bold(t.color(t.icon + "  " + t.label)) : dim("   " + t.label);
    lines.push(prefix + label);

    if (isSelected) {
      lines.push("");
      for (const part of t.parts) {
        lines.push("      " + dim("•") + " " + part);
      }
      lines.push("");
      lines.push("      " + dim("→ " + t.devNotes));
      lines.push("");
    }
  }
  lines.push("");
  return lines;
}

async function pickTemplate() {
  let selected = 0;
  let lastLineCount = 0;

  const draw = () => {
    if (lastLineCount > 0) clearLines(lastLineCount);
    const lines = renderMenu(TEMPLATES, selected);
    process.stdout.write(lines.join("\n") + "\n");
    lastLineCount = lines.length + 1;
  };

  draw();

  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (key) => {
      if (key === "[A") {                 // up
        selected = (selected - 1 + TEMPLATES.length) % TEMPLATES.length;
        draw();
      } else if (key === "[B") {           // down
        selected = (selected + 1) % TEMPLATES.length;
        draw();
      } else if (key === "\r" || key === "\n") { // enter
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve(TEMPLATES[selected]);
      } else if (key === "q" || key === "") { // q or ctrl-c
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve(null);
      }
    });
  });
}

// ─── Ask for project name ─────────────────────────────────────────────────────
function askProjectName(defaultName) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(
      bold("\n  Project name: ") + dim(`(${defaultName}) `),
      (answer) => {
        rl.close();
        resolve(answer.trim() || defaultName);
      }
    );
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  process.stdout.write("\n");
  process.stdout.write(
    bold(cyan("  ╔══════════════════════════════════╗\n")) +
    bold(cyan("  ║  ")) + bold("  create-starter-app  ") + bold(cyan("          ║\n")) +
    bold(cyan("  ╚══════════════════════════════════╝\n"))
  );

  const template = await pickTemplate();

  if (!template) {
    process.stdout.write(dim("\n  Cancelled.\n\n"));
    process.exit(0);
  }

  const projectName = await askProjectName(template.id.replace(/^template-/, ""));
  const dest = resolve(process.cwd(), projectName);

  if (existsSync(dest)) {
    process.stdout.write(red(`\n  Error: directory "${projectName}" already exists.\n\n`));
    process.exit(1);
  }

  const src = join(STARTERS_DIR, template.id);
  process.stdout.write(dim(`\n  Copying ${template.label} → ${projectName} ...\n`));

  cpSync(src, dest, {
    recursive: true,
    filter: (s) => !s.includes("node_modules") && !s.includes(".next") && !s.includes("dist"),
  });

  // Rewrite package.json name field
  const pkgPath = join(dest, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    pkg.name = projectName;
    pkg.private = true;
    delete pkg.version; // let user set it
    const { writeFileSync } = await import("fs");
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  }

  process.stdout.write(
    green(`\n  ✓ Created `) + bold(projectName) + green("!\n") +
    dim("\n  Next steps:\n") +
    dim(`    cd ${projectName}\n`) +
    dim("    cp .env.example .env   # if present\n") +
    dim("    bun install            # or npm/pnpm install\n") +
    dim("    bun dev                # start dev server\n\n")
  );
}

main().catch((err) => {
  process.stderr.write(red("  Error: ") + err.message + "\n");
  process.exit(1);
});
