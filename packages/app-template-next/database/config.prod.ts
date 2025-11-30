import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./database/schema.ts",
  out: "./database/migrations/production",
  verbose: true,
  dbCredentials: {
    url: "file:./prod.db",
  },
});
