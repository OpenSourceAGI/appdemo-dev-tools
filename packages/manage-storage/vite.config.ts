import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/manage-storage.ts"),
      name: "ManageStorage",
      fileName: "manage-storage",
      formats: ["es"],
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      external: ["dotenv"],
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
