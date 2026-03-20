import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const SRC_PATH = path.resolve(__dirname, "./src");
const PUBLIC_PATH = path.resolve(__dirname, "../public");
const DIST_PATH = path.resolve(__dirname, "../dist");

export default defineConfig({
  root: SRC_PATH,
  publicDir: PUBLIC_PATH,
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: [
      {
        find: "@web-speed-hackathon-2026/client",
        replacement: path.resolve(__dirname, "."),
      },
      {
        find: "bayesian-bm25",
        replacement: path.resolve(__dirname, "node_modules/bayesian-bm25/dist/index.js"),
      },
      {
        find: "kuromoji",
        replacement: path.resolve(__dirname, "node_modules/kuromoji/build/kuromoji.js"),
      },
      {
        find: /^@ffmpeg\/core\/wasm$/,
        replacement: path.resolve(
          __dirname,
          "node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm",
        ),
      },
      {
        find: /^@ffmpeg\/core$/,
        replacement: path.resolve(
          __dirname,
          "node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js",
        ),
      },
      {
        find: /^@imagemagick\/magick-wasm\/magick\.wasm$/,
        replacement: path.resolve(
          __dirname,
          "node_modules/@imagemagick/magick-wasm/dist/magick.wasm",
        ),
      },
    ],
  },
  define: {
    "process.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
    "process.env.COMMIT_HASH": JSON.stringify(process.env["SOURCE_VERSION"] ?? ""),
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: DIST_PATH,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "scripts/[name]-[hash].js",
        chunkFileNames: "scripts/chunk-[hash].js",
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? "";
          if (name.endsWith(".css")) return "styles/[name][extname]";
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
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
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/core"],
  },
});
