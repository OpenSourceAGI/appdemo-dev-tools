import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import Stripe from "stripe";
import * as tables from "@/database/tables";
import env from "@/env";
import { db } from "@/database";
import { sendMagicLink } from "@/emails/magic-link";
import { APP_NAME } from "@/lib";

// Initialize Stripe client
const stripeClient = new Stripe(env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
});

export const auth = betterAuth({
  appName: APP_NAME,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  logger: {
    disabled: process.env.NODE_ENV === "production",
    level: "debug",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    cookieCache: {
      enabled: false,
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID as string,
      clientSecret: env.GITHUB_CLIENT_SECRET as string,
    },
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      ...tables,
    },
    usePlural: true,
  }),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }, request) => {
        if (process.env.NODE_ENV === "development") {
          console.log("✨ Magic link: " + url);
        }
        await sendMagicLink(email, url);
      },
    }),
    stripe({
      stripeClient,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET as string,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "basic",
            priceId: "price_basic_monthly", // Replace with your actual Stripe price ID
            limits: {
              projects: 5,
              storage: 10,
            },
          },
          {
            name: "pro",
            priceId: "price_pro_monthly", // Replace with your actual Stripe price ID
            annualDiscountPriceId: "price_pro_yearly", // Replace with your actual annual price ID
            limits: {
              projects: 20,
              storage: 50,
            },
            freeTrial: {
              days: 14,
            },
          },
          {
            name: "enterprise",
            priceId: "price_enterprise_monthly", // Replace with your actual Stripe price ID
            annualDiscountPriceId: "price_enterprise_yearly", // Replace with your actual annual price ID
            limits: {
              projects: 100,
              storage: 500,
            },
          },
        ],
      },
    }),
  ],
});
