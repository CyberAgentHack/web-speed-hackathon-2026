import { constants } from "node:zlib";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { compression } from "vite-plugin-compression2";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { viteStaticCopy } from "vite-plugin-static-copy";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: resolve(__dirname, "src"),

  plugins: [
    // Buffer / global polyfills (replaces webpack ProvidePlugin)
    nodePolyfills({
      include: ["buffer"],
      globals: { Buffer: true, global: true },
    }),

    react(),

    // KaTeX fonts (replaces CopyWebpackPlugin)
    viteStaticCopy({
      targets: [
        {
          src: resolve(__dirname, "node_modules/katex/dist/fonts/*"),
          dest: "styles/fonts",
        },
      ],
    }),

    // Pre-compressed brotli files (quality 11 = max compression, served instantly at runtime)
    compression({
      algorithm: "brotliCompress",
      exclude: [/\.(br|gz)$/],
      compressionOptions: {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
      },
      threshold: 1024,
    }),

    // Pre-compressed gzip files as fallback for older browsers
    compression({
      algorithm: "gzip",
      exclude: [/\.(br|gz)$/],
      threshold: 1024,
    }),
  ],

  define: {
    // Replaces webpack EnvironmentPlugin
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __COMMIT_HASH__: JSON.stringify(process.env["SOURCE_VERSION"] ?? ""),
  },

  resolve: {
    alias: {
      // Replaces webpack module aliases
      "bayesian-bm25": resolve(__dirname, "node_modules/bayesian-bm25/dist/index.js"),
      kuromoji: resolve(__dirname, "node_modules/kuromoji/build/kuromoji.js"),
      "@ffmpeg/ffmpeg": resolve(__dirname, "node_modules/@ffmpeg/ffmpeg/dist/esm/index.js"),
    },
  },

  // Exclude heavy WASM-based packages from esbuild pre-bundling
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/core"],
  },

  build: {
    outDir: resolve(__dirname, "../dist"),
    emptyOutDir: true,
    target: "es2020",
    rollupOptions: {
      output: {
        // Content-hashed filenames enable immutable browser caching
        entryFileNames: "scripts/[name]-[hash].js",
        chunkFileNames: "scripts/chunk-[hash].js",
        assetFileNames: (info) =>
          info.name?.endsWith(".css")
            ? "styles/[name]-[hash][extname]"
            : "assets/[name]-[hash][extname]",

        // Split core framework libs into separate cacheable chunks
        manualChunks(id) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "vendor-react";
          }
          if (id.includes("node_modules/react-router/")) {
            return "vendor-router";
          }
          if (
            id.includes("node_modules/redux/") ||
            id.includes("node_modules/react-redux/") ||
            id.includes("node_modules/redux-form/")
          ) {
            return "vendor-redux";
          }
        },
      },
    },
  },
});
