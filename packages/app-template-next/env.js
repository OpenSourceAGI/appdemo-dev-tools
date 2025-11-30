import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const env = createEnv({
  // Server-side environment variables
  server: {
    // Database - D1 binding for Cloudflare Workers
    DB: z.any(), // D1 database binding

    // Authentication credentials
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    BETTER_AUTH_SECRET: z.string(),

    // API keys
    RESEND_API_KEY: z.string(),

    // Payments
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
  },

  // Client-side public environment variables
  client: {
    // Application settings
    NEXT_PUBLIC_APP_URL: z.string(),
    NEXT_PUBLIC_CACHE_ENCRYPTION_KEY: z.string(),

    // Analytics
    NEXT_PUBLIC_POSTHOG_API_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),

    // Payments
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string(),
  },

  // Linking runtime environment variables
  runtimeEnv: {
    // Database - D1 binding
    DB: process.env.DB,

    // Authentication credentials
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,

    // API keys
    RESEND_API_KEY: process.env.RESEND_API_KEY,

    // Application settings
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CACHE_ENCRYPTION_KEY:
      process.env.NEXT_PUBLIC_CACHE_ENCRYPTION_KEY,

    // Analytics
    NEXT_PUBLIC_POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.POSTHOG_HOST,

    // Payments
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
});

export default env;
