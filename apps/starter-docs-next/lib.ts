// Utility functions
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Metadata utilities
import env from "@/env";
import type { Metadata } from "next/types";

const APP_NAME =
  process.env.NODE_ENV === "development" ? "DEV - Startstack" : "Startstack";

export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    openGraph: {
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      url: env.NEXT_PUBLIC_APP_URL,
      images: "https://demo.better-auth.com/og.png",
      siteName: APP_NAME,
      ...override.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      creator: "@warisareshi",
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      images: "https://demo.better-auth.com/og.png",
      ...override.twitter,
    },
    metadataBase: override.metadataBase ?? new URL(env.NEXT_PUBLIC_APP_URL),
  };
}

// Action client utilities
import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "./lib/auth";

const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error("Action error:", e.message);

    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
}).use(async ({ next, clientInput, metadata }) => {
  const startTime = performance.now();

  const result = await next();

  const endTime = performance.now();

  console.log(`Server action ${metadata.actionName} 
    with input: 
    ${clientInput} took ${endTime - startTime}ms 
    and resulted with:
     ${result}`);

  return result;
});

export const authActionClient = actionClient
  .use(async ({ next }) => {
    const res = await auth.api.getSession({
      headers: await headers(),
    });

    if (!res || !res.session || !res.user) {
      throw new Error("You are not authorized to perform this action");
    }
    const extraUtils = {
      authenticatedUrl: "/app/home",
      unauthenticatedUrl: "/login",
      appName: APP_NAME,
    };
    return next({
      ctx: {
        user: res.user,
        session: res.session,
        utils: extraUtils,
      },
    });
  })
  .outputSchema(
    z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.any(),
    }),
  );

// Constants
type PaymentProvider = "stripe" | "paddle";

export const APP_NAME =
  process.env.NODE_ENV === "development" ? "DEV - Startstack" : "Startstack";
export const PAYMENT_PROVIDER: PaymentProvider = "stripe";
