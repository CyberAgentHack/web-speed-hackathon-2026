import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/katex/dist/fonts/*",
          dest: "styles/fonts",
        },
      ],
    }),
  ],
  define: {
    "import.meta.env.VITE_BUILD_DATE": JSON.stringify(new Date().toISOString()),
    "import.meta.env.VITE_COMMIT_HASH": JSON.stringify(process.env.SOURCE_VERSION ?? ""),
  },
  resolve: {
    alias: {
      "@web-speed-hackathon-2026/client": path.resolve(__dirname, "."),
      "bayesian-bm25": path.resolve(__dirname, "node_modules/bayesian-bm25/dist/index.js"),
      kuromoji: path.resolve(__dirname, "node_modules/kuromoji/build/kuromoji.js"),
    },
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/core"],
  },
  build: {
    outDir: path.resolve(__dirname, "../dist"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
      },
    },
  },
});
