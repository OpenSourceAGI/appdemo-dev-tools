# Full Stack Kit - React Next.js  BetterAuth Drizzle Shadcn

## Features

- Magic Link Auth: login with Better-Auth & Resend, plus GitHub OAuth.
- Protected Access: protected routes and middleware.
- Modern UI/UX: Tailwind CSS, dark/light mode, and dashboards.
- Type-Safe Development: TypeScript, Drizzle ORM, PostgreSQL, Zod validation.
- Analytics: PostHog integration.
- Payments: Stripe integration with Better Auth for subscriptions and billing.

## Tech Stack

- Framework: Next.js
- Authentication: Better-Auth
- Database: PostgreSQL
- ORM: Drizzle
- Styling: Tailwind CSS
- Email: Resend
- Analytics: PostHog
- Validation: Zod

## Roadmap

### Completed

- [x] Magic Link Authentication with Better-Auth and Resend
- [x] GitHub OAuth Integration
- [x] Protected Routes
- [x] User Settings
- [x] Dark/Light Mode
- [x] Dashboard & Sidebar (shadcn)
- [x] T3 Env Integration
- [x] Zod Validation
- [x] Drizzle + PostgreSQL Setup
- [x] PostHog Analytics
- [x] Landing Page

### Upcoming

- [x] Payments (Stripe integration with Better Auth)
- [ ] Minor fixes here and there to Improve UX & DX
- [ ] Ship v1
- [ ] Create full setup tutorial

## Stripe Setup

This project uses Stripe for payments and subscriptions, integrated with Better Auth.

### Prerequisites

1. **Stripe Account**: Create a Stripe account at [stripe.com](https://stripe.com)
2. **Stripe Products & Prices**: Create products and prices in your Stripe dashboard
3. **Webhook Endpoint**: Set up webhook endpoint in Stripe dashboard

### Configuration Steps

1. **Get Stripe Keys**:
   - Go to Stripe Dashboard → Developers → API Keys
   - Copy your Publishable Key and Secret Key
   - Add them to your `.env` file

2. **Create Products & Prices**:
   - Create products in Stripe Dashboard → Products
   - Create prices for each product (monthly/yearly)
   - Copy the Price IDs (e.g., `price_1234567890`)

3. **Update Price IDs**:
   - Edit `lib/auth/server.ts`
   - Replace placeholder price IDs with your actual Stripe Price IDs:
     ```typescript
     plans: [
       {
         name: "basic",
         priceId: "price_your_basic_monthly_id", // Replace with actual ID
         // ...
       },
       // ...
     ]
     ```

4. **Set up Webhooks**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/auth/stripe/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env`

5. **Environment Variables**:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   ```

## Docker Setup

This project includes Docker and Docker Compose configuration for easy development and deployment.

### Prerequisites

- Docker and Docker Compose installed
- Bun package manager (recommended) or Node.js
- Stripe account and API keys (see Stripe Setup above)

### Quick Start with Docker

1. **Clone and setup environment:**
   ```bash
   git clone <repository-url>
   cd starter-next-better-drizzle
   cp env.example .env
   # Edit .env with your actual values including Stripe keys
   ```

2. **Start development environment:**
   ```bash
   bun run docker:dev
   ```

3. **Access the application:**
   - Next.js App: http://localhost:3000
   - PostgreSQL: localhost:5432
   - Drizzle Studio: http://localhost:4983

### Docker Commands

```bash
# Development
bun run docker:dev              # Start with logs
bun run docker:dev:detach       # Start in background
bun run docker:down             # Stop containers
bun run docker:logs             # View logs

# Production
bun run docker:prod             # Start production build
bun run docker:prod:detach      # Start production in background

# Database
bun run drizzle:migrate:dev     # Run migrations
bun run drizzle:generate:dev    # Generate new migrations
bun run drizzle:studio          # Open Drizzle Studio (local)
bun run drizzle:studio:docker   # Open Drizzle Studio (Docker)

# Cleanup
bun run docker:down:volumes     # Stop and remove volumes
bun run docker:clean            # Clean Docker system
```

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Database (Docker)
DATABASE_URL_DEVELOPMENT=postgresql://startstack_user:startstack_password@postgres:5432/startstack
DATABASE_URL_PRODUCTION=postgresql://startstack_user:startstack_password@postgres:5432/startstack

# Authentication
BETTER_AUTH_SECRET=your-secret-here
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email
RESEND_API_KEY=your-resend-api-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CACHE_ENCRYPTION_KEY=your-cache-key
```

### Database Management

- **Drizzle Studio**: Access at http://localhost:4983
  - Modern web interface for Drizzle ORM
  - View and edit data, run queries, manage schema
- **Direct Connection**: `postgresql://startstack_user:startstack_password@localhost:5432/startstack`

### Production Deployment

1. Set up environment variables for production
2. Use production compose file:
   ```bash
   bun run docker:prod
   ```

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add YourFeature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Submit a Pull Request.

For issues or feature requests, create an issue in the GitHub repository.
