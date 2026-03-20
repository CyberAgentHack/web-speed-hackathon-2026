import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const ROOT = import.meta.dirname;
const NM = resolve(ROOT, "node_modules");

export default defineConfig({
  root: resolve(ROOT, "src"),
  publicDir: resolve(ROOT, "../public"),

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@web-speed-hackathon-2026/client": ROOT,
      "bayesian-bm25": resolve(NM, "bayesian-bm25/dist/index.js"),
      kuromoji: resolve(NM, "kuromoji/build/kuromoji.js"),
      "@ffmpeg/ffmpeg": resolve(NM, "@ffmpeg/ffmpeg/dist/esm/index.js"),
    },
  },

  define: {
    "process.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
    "process.env.COMMIT_HASH": JSON.stringify(process.env["SOURCE_VERSION"] ?? ""),
    "process.env.NODE_ENV": JSON.stringify("production"),
  },

  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },

  build: {
    outDir: resolve(ROOT, "../dist"),
    emptyOutDir: true,
    copyPublicDir: true,
    rolldownOptions: {
      output: {
        chunkFileNames: "scripts/chunk-[hash].js",
        entryFileNames: "scripts/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
      },
    },
  },

  optimizeDeps: {
    include: ["negaposi-analyzer-ja"],
  },
});
