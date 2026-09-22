import { defineConfig } from "vite";

/** Build each entry as a self-contained IIFE (no shared chunks). */
function entryConfig(name, emptyOutDir) {
  return {
    build: {
      emptyOutDir,
      outDir: "dist",
      target: "esnext",
      rollupOptions: {
        input: {
          [name]: `src/${name}.js`,
        },
        output: {
          entryFileNames: "[name].js",
          format: "iife",
          name: `ese_${name}`,
          inlineDynamicImports: true,
        },
      },
    },
  };
}

export default defineConfig(({ command }) => {
  // Vite CLI runs one config; we chain builds via npm scripts instead.
  // Default export builds content; popup is built by vite.popup.config.js
  if (command === "build") {
    return entryConfig("content", true);
  }
  return entryConfig("content", true);
});
