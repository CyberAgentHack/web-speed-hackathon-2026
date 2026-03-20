import path from "path";
import { fileURLToPath } from "url";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const CLIENT_ROOT = fileURLToPath(new URL(".", import.meta.url));
const PROJECT_ROOT = path.resolve(CLIENT_ROOT, "..");

const BUILD_DATE = new Date().toISOString();
const COMMIT_HASH = process.env["SOURCE_VERSION"] ?? "";

export default defineConfig({
  plugins: [tailwindcss()],
  publicDir: path.resolve(PROJECT_ROOT, "public"),
  resolve: {
    alias: [
      {
        find: "@web-speed-hackathon-2026/client",
        replacement: CLIENT_ROOT,
      },
      {
        find: /^bayesian-bm25$/,
        replacement: path.resolve(CLIENT_ROOT, "node_modules", "bayesian-bm25/dist/index.js"),
      },
      {
        find: /^kuromoji$/,
        replacement: path.resolve(CLIENT_ROOT, "node_modules", "kuromoji/build/kuromoji.js"),
      },
    ],
  },
  define: {
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __COMMIT_HASH__: JSON.stringify(COMMIT_HASH),
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      "/api": "http://localhost:3000",
      "/images": "http://localhost:3000",
      "/movies": "http://localhost:3000",
      "/sounds": "http://localhost:3000",
    },
  },
  build: {
    outDir: path.resolve(PROJECT_ROOT, "dist"),
    emptyOutDir: true,
  },
});
