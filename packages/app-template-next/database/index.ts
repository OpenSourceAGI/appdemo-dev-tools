import * as tables from "./tables";
import { drizzle } from "drizzle-orm/d1";
import env from "@/env";

// For Cloudflare D1, we'll use the D1 database binding
// In development, we'll use a local SQLite file
// In production, we'll use the D1 binding

let db: any;

if (process.env.NODE_ENV === "development") {
  // For development, we'll use a local SQLite file
  // You can use better-sqlite3 or similar for local development
  throw new Error("D1 development setup not configured. Use Cloudflare Workers for development.");
} else {
  // For production (Cloudflare Workers), use the D1 binding
  // This assumes you have a D1 binding named 'DB' in your wrangler.toml
  db = drizzle(env.DB, { schema: { ...tables } });
}

export { db };
