import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: "dist",
    target: "esnext",
    rollupOptions: {
      input: {
        popup: "src/popup.js",
      },
      output: {
        entryFileNames: "[name].js",
        format: "iife",
        name: "ese_popup",
        inlineDynamicImports: true,
      },
    },
  },
});
