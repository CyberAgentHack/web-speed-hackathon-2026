import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  publicDir: false,
  plugins: [
    react(),
  ],
  resolve: {
    alias: [
      // 具体的なパスを先に（prefix matchの優先順位）
      { find: /^@ffmpeg\/core\/wasm$/, replacement: path.resolve(__dirname, "node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm") },
      { find: /^@ffmpeg\/core$/, replacement: path.resolve(__dirname, "node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js") },
      { find: /^@ffmpeg\/ffmpeg$/, replacement: path.resolve(__dirname, "node_modules/@ffmpeg/ffmpeg/dist/esm/index.js") },
      { find: /^@imagemagick\/magick-wasm\/magick\.wasm$/, replacement: path.resolve(__dirname, "node_modules/@imagemagick/magick-wasm/dist/magick.wasm") },
      { find: /^bayesian-bm25$/, replacement: path.resolve(__dirname, "node_modules/bayesian-bm25/dist/index.js") },
      { find: /^kuromoji$/, replacement: path.resolve(__dirname, "node_modules/kuromoji/build/kuromoji.js") },
      { find: "@web-speed-hackathon-2026/client", replacement: path.resolve(__dirname, ".") },
    ],
    extensions: [".tsx", ".ts", ".mjs", ".cjs", ".jsx", ".js"],
  },
  define: {
    "process.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
    "process.env.COMMIT_HASH": JSON.stringify(process.env["SOURCE_VERSION"] || ""),
    "process.env.NODE_ENV": JSON.stringify("production"),
    // bracket notation 用
    'process.env["BUILD_DATE"]': JSON.stringify(new Date().toISOString()),
    'process.env["COMMIT_HASH"]': JSON.stringify(process.env["SOURCE_VERSION"] || ""),
    'process.env["NODE_ENV"]': JSON.stringify("production"),
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
      output: {
        entryFileNames: "scripts/[name].[hash:8].js",
        chunkFileNames: "scripts/chunk-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0]?.endsWith(".css")) {
            return "styles/[name].[hash].css";
          }
          return "assets/[name].[hash][extname]";
        },
      },
    },
    cssCodeSplit: true,
    target: "esnext",
    minify: "esbuild",
  },
  css: {
    // postcss.config.js を自動検出
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/core", "@ffmpeg/core/wasm", "@imagemagick/magick-wasm"],
  },
  ssr: {
    // SSRバンドルは dist/server/ に出力されるので、全依存をバンドルに含める
    noExternal: true,
  },
});
