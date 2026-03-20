import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const ROOT = import.meta.dirname;
const NM = resolve(ROOT, "node_modules");

export default defineConfig({
  root: resolve(ROOT, "src"),
  publicDir: false,

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

  ssr: {
    // react-dom/server 等をバンドルに含める（dist-ssr のパス解決問題を回避）
    noExternal: true,
  },

  build: {
    ssr: resolve(ROOT, "src/entry-server.tsx"),
    outDir: resolve(ROOT, "../dist-ssr"),
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
