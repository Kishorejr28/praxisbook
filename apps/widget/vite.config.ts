import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "PraxisBook",
      fileName: "praxisbook-widget",
      formats: ["iife"],
    },
    rollupOptions: {
      output: {
        // Inline everything — single self-contained .js file
        inlineDynamicImports: true,
      },
    },
    outDir: "dist",
    minify: "esbuild",
  },
});
