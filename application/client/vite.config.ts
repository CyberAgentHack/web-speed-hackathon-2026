import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import analyze from "vite-bundle-analyzer";

export default defineConfig({
  plugins: [
    nodePolyfills(),
    react(),
    tailwindcss(),
    ...(process.env["VITE_ANALYZE"] === "true" ? [analyze()] : []),
  ],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              test: /debug/,
              name: "debug",
            },
            {
              test: /highlight.js/,
              name: "highlight",
            },
            {
              test: /katex/,
              name: "katex",
            },
            {
              test: /@imagemagick/,
              name: "imagemagick",
            },
          ],
        },
      },
    },
  },
  test: {
    includeSource: ["src/**/*.ts"],
  },
});
