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

**[docs](apps/docs/)** - Main documentation site built with Fumadocs featuring AI-powered chat, full-text search, and automatic API documentation generation from TypeScript and OpenAPI specs.

**[Cloud-Computer-Control-Panel](apps/Cloud-Computer-Control-Panel/)** - AWS infrastructure management platform for provisioning EC2 instances and deploying containers with automated Dokploy integration.

### Starter Templates

**[template-svelte-betterauth-drizzle-shadcn](packages/template-svelte-betterauth-drizzle-shadcn/)** (Main) - Full-stack SvelteKit application with Better Auth, Drizzle ORM on Cloudflare D1, Stripe payments, and Bits UI components. Deploy to Cloudflare Pages with edge database and serverless API routes.

**[template-nextjs-drizzle-betterauth-shadcn](packages/template-nextjs-drizzle-betterauth-shadcn/)** - Next.js SaaS boilerplate with PostgreSQL, Better Auth, Stripe subscriptions, and UploadThing file uploads. Includes user management UI and team/organization support with shadcn/ui components.

**[template-nextjs-betterauth-prisma-shadcn](packages/template-nextjs-betterauth-prisma-shadcn/)** - Lightweight Next.js starter focused on authentication flows with Prisma ORM and Better Auth. Features Google OAuth, credential login, profile management, and protected routes with Motion animations.

**[template-fumadocs](packages/template-fumadocs/)** - Documentation site template with Fumadocs featuring Orama search, OpenAPI/Swagger docs, and TypeScript API reference. Includes MDX support, code highlighting with Shiki, and collapsible sidebar navigation.

**[template-docusaurus](packages/template-docusaurus/)** - Docusaurus 3 documentation template with offline Lunr search and OpenAPI plugin integration. Classic documentation theme optimized for technical docs with Google Analytics and multi-language support.

### Utility Packages

**[about-system-info](packages/about-system-info/)** - Cross-platform CLI tool displaying system information with emojis including CPU, memory, disk, network details, and running services. Install globally and add to shell greeting for automatic system overview on terminal launch.

**[create-cloud-db](packages/create-cloud-db/)** - Interactive CLI to create Turso edge database and automatically write connection credentials to .env file. One-command setup for SQLite-compatible serverless databases with instant global replication.

**[manage-storage](packages/manage-storage/)** - Unified API for managing cloud storage across AWS S3, Cloudflare R2, and Backblaze B2. Automatically detects provider from credentials and provides consistent interface for uploads, downloads, and file management.

**[open-when-ready](packages/open-when-ready/)** - Smart dev server wrapper that monitors process output and auto-opens browser when ready. Wraps any CLI command (npm, bun, vite) and detects ports from console output.

**[server-shell-setup](packages/server-shell-setup/)** - Bash installation scripts for configuring Linux/macOS shells with fish, neovim, starship prompt, docker, and node. Supports interactive menu or automated installation of dev tools across Arch, Ubuntu, Debian, Fedora, Alpine, and Termux.

**[docs](packages/docs/)** - Shared Fumadocs configuration package containing documentation content and settings. Used by the main docs app for centralized documentation management.

---

### 🖼️ Screenshots

<img width="350px" src="https://i.imgur.com/jIaL6yP.png" />
