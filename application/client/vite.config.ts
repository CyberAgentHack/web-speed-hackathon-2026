import path from "node:path";

import tailwindcss from "@tailwindcss/postcss";
import react from "@vitejs/plugin-react";
import postcssImport from "postcss-import";
import postcssPresetEnv from "postcss-preset-env";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const SRC_PATH = path.resolve(__dirname, "./src");

export default defineConfig({
  root: "src",
  publicDir: false,
  base: "/",

  resolve: {
    alias: [
      {
        find: "@web-speed-hackathon-2026/client",
        replacement: path.resolve(__dirname),
      },
      {
        find: /^bayesian-bm25$/,
        replacement: path.resolve(__dirname, "node_modules/bayesian-bm25/dist/index.js"),
      },
      {
        find: /^kuromoji$/,
        replacement: path.resolve(__dirname, "node_modules/kuromoji/build/kuromoji.js"),
      },
      {
        find: /\.\.\/dict\/pn_ja\.dic\.json$/,
        replacement: path.resolve(SRC_PATH, "data/pn_ja.dic.json"),
      },
    ],
  },

  define: {
    "process.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
    "process.env.COMMIT_HASH": JSON.stringify(process.env["SOURCE_VERSION"] || ""),
    "process.env.NODE_ENV": JSON.stringify("production"),
    global: "globalThis",
  },

  css: {
    postcss: {
      plugins: [postcssImport(), tailwindcss(), postcssPresetEnv({ stage: 3 })],
    },
  },

  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(__dirname, "node_modules/katex/dist/fonts/*"),
          dest: "styles/fonts",
        },
      ],
    }),
  ],

  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: path.resolve(__dirname, "../dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "scripts/[name]-[hash].js",
        chunkFileNames: "scripts/chunk-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0]?.endsWith(".css")) {
            return "styles/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },

  optimizeDeps: {
    include: ["kuromoji", "bayesian-bm25", "gifler", "buffer"],
  },
});
