
# Starter Template: Next.js, shadcn/ui, Better Auth, Drizzle

A modern, Next.js Saas boilerplate with comprehensive authentication built on Better Auth, featuring a beautiful UI with shadcn/ui components and a robust tech stack.

## Tech Stack

- **Better Auth UI** - Pre-built authentication components
- **shadcn/ui** - Beautiful, accessible component library
- **Stripe** - Payment Provider
- **Biome** - Fast linter and formatter
- **Turborepo** - Monorepo build system
- **PostgreSQL** - Robust, production-ready database
- **Drizzle ORM** - Type-safe database queries
- **UploadThing** - Modern file uploads with built-in storage
- **Resend** - Transactional email service


## Roadmap

- [x] landing page
- [x] Authentication with Better Auth
- [x] Dashboard
- [x] Stripe Payment




##  Quick start

### 1. Clone the Repository
```bash
git clone https://github.com/indieceo/Indiesaas
cd indiesaas
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local` and update the variables.

```bash
cp .env.example .env.local
```

### 4. Database Setup
Generate the authentication schema and run migrations:

```bash
# Generate Better Auth schema
npx @better-auth/cli generate

# Generate Drizzle migrations
npx drizzle-kit generate

# Run migrations
npx drizzle-kit migrate
```

### 5. Start Development Server
```bash
npm run dev
# or
pnpm dev
```

##  Project Structure

Key configuration and structure files:

```
src/
├── app/                    # Next.js app directory
│   ├── (marketing)/       # Marketing pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── layout/           # Layout components
│   └── ui/               # shadcn/ui components
├── config/
│   └── site.ts           # Site configuration
├── lib/
│   ├── auth.ts           # Better Auth configuration
│   └── payments/         # Stripe payment logic
├── database/
│   ├── db.ts             # Database connection
│   └── schema.ts         # Database schema
└── styles/               # Global styles

drizzle.config.ts         # Drizzle ORM configuration
next.config.ts            # Next.js configuration
biome.json                # Biome linter/formatter config
```


## Usage

Feel free to use and customize this template as per your requirements. You can modify the components, styles, and content to create your unique website.

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute it as you wish.