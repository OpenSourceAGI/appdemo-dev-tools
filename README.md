<p align="center">
    <img width="350px" src="https://i.imgur.com/gGcme8r.png" />
</p>
<p align="center">
    <a href="https://github.com/vtempest/Svelte-Starter-DOCS/discussions">
        <img alt="GitHub Discussions"
            src="https://img.shields.io/github/discussions/vtempest/Svelte-Starter-DOCS" />
    </a>
     <a href="https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request">
        <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
    </a>
    <a href="https://codespaces.new/vtempest/Svelte-Starter-DOCS">
        <img src="https://github.com/codespaces/badge.svg" width="150" height="20" />
    </a>
</p>
<h3 align="center">
    <a href="https://starterdocs.vtempest.workers.dev">🎮 Demo</a>
    <a href="https://starterdocs.js.org">📑 Docs</a>
    <a href="https://starterdocs.js.org/docs/guides/starter-docs#%EF%B8%8F-installation">⬇️ Install </a>
    <a href="https://v0.app/templates/dashboard-landing-auth-billing-teams-docs-themes-ExDfusFzX6P"> 🎨 v0 Template </a>

</h3>

### ⚒️ Starter DOCS: Drizzle OAuth Cloudflare Shadcn

```bash
bun create starter-app
```

**Docs-Driven Development**: Generate easy-to-understand docs from your JS functions and APIs, to maximize reusable value and make the options clear to everyone.

**Functionally Brilliant, Elegantly Simple Toolkit:** StarterDOCS is to Starter Apps what Next.js is to React: full stack with smart defaults for common needs. It is easy to switch in alternatives: Such as running on AWS, Vercel or Cloudflare, or using React Next.js vs Svelte.

📚 [Drizzle ORM](https://orm.drizzle.team/kit-docs/quick) - lightweight ORM compatible with Cloudflare D1 and drizzle-kit to manage schema migrations

👤 [Better Auth](https://www.better-auth.com/docs/introduction)- Google oAuth sign-in and/or email signup via Resend mailer api, Stripe built-in, API docs, One Tap, with 4 email templates: reset password, change email, verify email, welcome. Settings and admin panel for users.

☁️ [Cloudflare](https://developers.cloudflare.com/pages/framework-guides) - serverless autoscaling API and D1 database, great hosting platform with free tier

🖼️ [shadcn-svelte](https://github.com/huntabyte/shadcn-svelte) - popular UI components, with [lucide](https://github.com/lucide-icons/lucide) icons

## 📦 Packages & Apps

### Apps

**[docs](apps/docs/)** - Documentation site with AI chat, full-text search, and auto-generated API docs from TypeScript and OpenAPI specs.
`bun dev`

**[Cloud-Computer-Control-Panel](apps/Cloud-Computer-Control-Panel/)** - Open-source cloud infrastructure management platform with automated Dokploy deployment for container orchestration on AWS EC2.
`bun dev`

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

**[vscode-cloud](packages/vscode-cloud/)** - Per-user VS Code (code-server) instances on Cloudflare Containers, protected by Cloudflare Access with auto-generated per-user passwords in Durable Object SQLite.
`bun deploy`

**[web2mobile-generator](packages/web2mobile-generator/)** - Transform any website into a native mobile app wrapper for iOS and Android. No coding required — just provide your URL.
`npx create-mobile-wrapper`


### 🖼️ Screenshots

<img width="350px" src="https://i.imgur.com/jIaL6yP.png" />
