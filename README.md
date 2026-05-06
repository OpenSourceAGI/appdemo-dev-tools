<p align="center">
    <img width="350px" src="https://i.imgur.com/gGcme8r.png" />
<h3 align="center">
     <a href="https://starterdocs.vtempest.workers.dev">🎮 Demo</a>
    <a href="https://starterdocs.js.org">📑 Docs</a>
    <a href="https://starterdocs.js.org/docs/guides/starter-docs#%EF%B8%8F-installation">⬇️ Install </a>
    <a href="https://v0.app/templates/dashboard-landing-auth-billing-teams-docs-themes-ExDfusFzX6P"> 🎨 v0 Template </a>
</h3>
<p align="center">
    <a href="https://discord.gg/SJdBqBz3tV">
        <img src="https://img.shields.io/discord/1110227955554209923.svg?label=Chat&logo=Discord&colorB=7289da&style=flat"
            alt="Join Discord" />
    </a>
     <a href="https://github.com/OpenSourceAGI/appdemo-dev-tools/discussions">
     <img alt="GitHub Stars" src="https://img.shields.io/github/stars/OpenSourceAGI/appdemo-dev-tools" /></a>
    <a href="https://github.com/OpenSourceAGI/appdemo-dev-tools/discussions">
    <img alt="GitHub Discussions"
        src="https://img.shields.io/github/discussions/OpenSourceAGI/appdemo-dev-tools" />
    </a>
<br />
    <a href="https://github.com/OpenSourceAGI/appdemo-dev-tools/pulse" alt="Activity">
        <img src="https://img.shields.io/github/commit-activity/m/OpenSourceAGI/appdemo-dev-tools" />
    </a>
    <img src="https://img.shields.io/github/last-commit/OpenSourceAGI/appdemo-dev-tools.svg" alt="GitHub last commit" />
<br />
    <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js" />
    <a href="https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request">
        <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg"
            alt="PRs Welcome" />
    </a>
    <a href="https://codespaces.new/OpenSourceAGI/appdemo-dev-tools">
    <img src="https://github.com/codespaces/badge.svg" width="150" height="20" />
    </a>
    </p>

### 📦 Packages & Apps

### Apps

**[docs](apps/docs/)** - Documentation site with AI chat, full-text search, and auto-generated API docs from TypeScript and OpenAPI specs.
`bun dev`

**[Cloud-Computer-Control-Panel](apps/Cloud-Computer-Control-Panel/)** - Open-source cloud infrastructure management platform with automated Dokploy deployment for container orchestration on AWS EC2.
`bun dev`

**[vscode-cloud](apps/vscode-cloud/)** - Per-user VS Code (code-server) instances on Cloudflare Containers, protected by Cloudflare Access with auto-generated per-user passwords in Durable Object SQLite.
`bun deploy`

### Starter Templates

**[template-svelte-betterauth-drizzle-shadcn](starter-templates/template-svelte-betterauth-drizzle-shadcn/)** - Full-stack SvelteKit app with Better Auth, Drizzle ORM on Cloudflare D1, Stripe payments, and shadcn-svelte components.
`bun create starter-app`

**[template-nextjs-betterauth-shadcn-drizzle](starter-templates/template-nextjs-betterauth-shadcn-drizzle/)** - Next.js SaaS boilerplate with PostgreSQL, Better Auth, Stripe subscriptions, and shadcn/ui components.
`bun create starter-app`

**[template-nextjs-betterauth-shadcn-prisma](starter-templates/template-nextjs-betterauth-shadcn-prisma/)** - Lightweight Next.js starter with Prisma ORM, Better Auth, Google OAuth, credential login, and protected routes.
`bun create starter-app`

**[template-fumadocs](starter-templates/template-fumadocs/)** - Documentation site with Fumadocs, Orama search, OpenAPI/Swagger docs, MDX support, and collapsible sidebar.
`bun create starter-app`

**[template-docusaurus](starter-templates/template-docusaurus/)** - Docusaurus 3 docs template with offline Lunr search, OpenAPI plugin, and classic theme optimized for technical docs.
`bun create starter-app`

### Utility Packages

**[create-starter-app](packages/create-starter-app/)** - Interactive CLI to scaffold a starter app from curated templates, picking framework, auth, database, and UI library.
`bun create starter-app`

**[about-system-info](packages/about-system-info/)** - Cross-platform CLI showing CPU, memory, disk, network, and running services with emojis. Add to shell greeting for instant system overview on terminal launch.
`npx about-system`

**[api2ai-mcp-generator](packages/api2ai-mcp-generator/)** - Generate production-ready MCP servers from any OpenAPI spec using the mcp-use framework (8k+ GitHub stars). Bring any REST API to AI agents in minutes.
`npx api2ai <openapi-spec-url>`

**[create-cloud-db](packages/create-cloud-db/)** - Interactive CLI to create a Turso edge database and write `TURSO_*` connection credentials directly to your `.env` file.
`npx create-cloud-db`

**[manage-storage](packages/manage-storage/)** - Unified API for AWS S3, Cloudflare R2, and Backblaze B2. Auto-detects provider from credentials for consistent uploads, downloads, and file management.
`npm install manage-storage`

**[open-when-ready](packages/open-when-ready/)** - Smart dev server wrapper that monitors output, auto-opens browser on ready, and routes errors to AI search. Works with any CLI tool.
`npx open-ready <command>`

**[shadcn-theme-menu](packages/shadcn-theme-menu/)** - Drop-in theme switcher component for shadcn/ui with 24+ color themes, dark/light mode toggle, and smooth animations.
`npm install shadcn-themes`

**[cloudflare-to-claude-fix](packages/cloudflare-to-claude-fix/)** - Cloudflare Workers Queue consumer that fires a Claude Code routine whenever a Workers build fails. Requires Workers Paid and Claude Pro.
`bun deploy`

**[git0-repo-downloader](packages/git0-repo-downloader/)** - CLI to search GitHub repositories, download source & releases for your system, install dependencies, and open the code editor.
`git0 <repo>`

**[react-download-app-buttons](packages/react-download-app-buttons/)** - React components for app store and platform download buttons (App Store, Google Play, Chrome Extension, Windows, macOS, Linux).
`npm install react-download-app-buttons`

**[server-shell-setup](packages/server-shell-setup/)** - One-command setup for a modern dev environment: fish, nvim, nushell, bun, node, helix, starship, docker, and more. Supports Arch, Ubuntu/Debian, Android (Termux), macOS, Fedora, Alpine.
`wget -qO- tinyurl.com/shellsetup | bash`

**[verify-phone-sms](packages/verify-phone-sms/)** - SMS phone verification API using AWS SNS with Hono server on Cloudflare Workers. Includes VoIP blocking, API key auth, and rate limiting.
`bun deploy`

**[web2mobile-wrapper](packages/web2mobile-wrapper/)** - Transform any website into a native mobile app wrapper for iOS and Android. No coding required — just provide your URL.
`npx create-mobile-wrapper`
