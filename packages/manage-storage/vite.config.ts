import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ManageStorage",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["@aws-lite/client", "@aws-lite/s3", "dotenv"],
      output: {
        preserveModules: false,
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [
    dts({
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      outDir: "dist",
      rollupTypes: true,
    }),
  ],
});
