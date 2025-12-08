<p align="center">
    <img width="350px" src="https://i.imgur.com/PE4kQWy.png" />
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
    <a href="https://starterdocs.js.org">📑 Docs (starterdocs.js.org)</a>
    <a href="https://starterdocs.js.org/docs/guides/starter-docs#%EF%B8%8F-installation">⬇️ Installation</a>
    
</h3>

### ⚒️ Starter DOCS: Drizzle OAuth Cloudflare Svelte

**Docs-Driven Development**: Generate easy-to-understand docs from your JS functions and APIs, to maximize reusable value and make the options clear to everyone.

**Functionally Brilliant, Elegantly Simple Toolkit:** StarterDOCS is to SvelteKit what Next.js is to React: full stack with smart defaults for common needs. It is 
easy to switch in alternatives: Such as running on AWS/GCE instead of Cloudflare, or using Next/Supabase isntead of Svelte/Cloudflare.

```bash
bun create starter-app
```


📚 [Drizzle ORM](https://orm.drizzle.team/kit-docs/quick) - lightweight ORM compatible with Cloudflare D1 and drizzle-kit to manage schema migrations

👤 [Better Auth](https://www.better-auth.com/docs/introduction)- Google oAuth sign-in and/or email signup via Resend mailer api, Stripe built-in, API docs, One Tap, with 4 email templates: reset password, change email, verify email, welcome. Settings and admin panel for users.

☁️ [Cloudflare for Svelte](https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-site/) - serverless autoscaling API and D1 database, great hosting platform with free tier

🖼️ [SvelteKit](https://svelte.dev/docs/kit/introduction) - full stack interface and API routes framework. Many developers prefer [Svelte over React](https://shakuro.com/blog/svelte-vs-react).

### 🧩 Interface Components

🎨 [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) + [Bits UI](https://github.com/huntabyte/bits-ui) + [shadcn-svelte](https://github.com/huntabyte/shadcn-svelte) - popular UI components, with  [lucide](https://github.com/lucide-icons/lucide) icons


📝 [formsnap](https://github.com/svecosystem/formsnap) + [sveltekit-superforms](https://github.com/ciscoheat/sveltekit-superforms) with [zod](https://github.com/colinhacks/zod) validation and [rate-limiting](https://github.com/ciscoheat/sveltekit-rate-limiter) in server memory

✅ [Vitest](https://vitest.dev/guide/ui) - unit testing UI

### 📦 Available Starter Templates

The `packages/` folder contains production-ready starter templates for different use cases:

#### 1. **template-svelte-auth-drizzle-shadcn** (Main Template)
Full-stack SvelteKit starter with authentication and database integration.

**Tech Stack:**
- **Framework:** SvelteKit with Cloudflare adapter
- **Database:** Drizzle ORM with Cloudflare D1
- **Auth:** Better Auth with Google OAuth
- **UI:** Tailwind CSS + shadcn-svelte + Bits UI
- **Forms:** Formsnap + Superforms with Zod validation
- **Email:** Resend for transactional emails
- **Testing:** Vitest with UI
- **Deployment:** Cloudflare Pages

#### 2. **template-nextjs-drizzle-betterauth**
Modern Next.js SaaS boilerplate with comprehensive authentication.

**Tech Stack:**
- **Framework:** Next.js 15 with App Router
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Better Auth with Better Auth UI components
- **UI:** shadcn/ui + Tailwind CSS
- **Payments:** Stripe integration
- **Uploads:** UploadThing for file management
- **Email:** Resend
- **Monorepo:** Turborepo
- **Linting:** Biome

#### 3. **template-nextjs-betterauth-prisma-shadcn**
Next.js starter focused on authentication with Prisma.

**Tech Stack:**
- **Framework:** Next.js 15
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** Better Auth (Google OAuth + Credentials)
- **UI:** shadcn + Tailwind CSS

#### 4. **template-fumadocs**
Documentation site template with search and API documentation.

**Tech Stack:**
- **Framework:** Next.js with Fumadocs
- **UI:** Fumadocs UI components
- **Search:** Orama search engine
- **API Docs:** Fumadocs OpenAPI + TypeScript support
- **Styling:** Tailwind CSS

#### 5. **template-docusaurus**
Documentation template using Docusaurus with OpenAPI support.

**Tech Stack:**
- **Framework:** Docusaurus 3
- **Search:** Lunr Search
- **API Docs:** OpenAPI Docs plugin + TypeDoc
- **Styling:** Tailwind CSS
- **React:** React 19

### 🖼️ Screenshots

<img width="350px" src="https://i.imgur.com/jIaL6yP.png" /><img width="350px" src="https://i.imgur.com/NlkjlWI.png" />