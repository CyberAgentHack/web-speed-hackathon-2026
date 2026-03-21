import path from "node:path";

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-markdown")) {
            return "markdown";
          }
          if (id.includes("node_modules/remark-") || id.includes("node_modules/rehype-")) {
            return "markdown";
          }
          if (id.includes("node_modules/react-syntax-highlighter")) {
            return "syntax-highlighter";
          }
          if (id.includes("node_modules/lowlight") || id.includes("node_modules/highlight.js")) {
            return "syntax-highlighter";
          }
          if (id.includes("node_modules/katex")) {
            return "katex";
          }
        },
      },
    },
  },
  define: {
    "process.env": JSON.stringify({
      BUILD_DATE: new Date().toISOString(),
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: "production",
    }),
  },
  plugins: [
    tailwindcss(),
    react(),
    nodePolyfills({
      include: ["buffer", "process"],
    }),
  ],
  resolve: {
    alias: {
      "@web-speed-hackathon-2026/client": path.resolve(__dirname),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
