import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const SRC_PATH = path.resolve(__dirname, "./src");
const DIST_PATH = path.resolve(__dirname, "../dist");

// kuromoji内のzlibjsはIIFEで`this`にZlibを登録するが、ESMでは`this`がundefinedになるため
// `this`を`globalThis`に書き換えるプラグイン
function fixZlibjsPlugin(): Plugin {
  return {
    name: "fix-zlibjs",
    enforce: "pre",
    transform(code, id) {
      if (id.includes("gunzip.min") || id.includes("zlibjs")) {
        return { code: code.replace("aa=this", "aa=globalThis"), map: null };
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), fixZlibjsPlugin()],
  root: SRC_PATH,
  publicDir: false,
  build: {
    outDir: DIST_PATH,
    emptyOutDir: true,
    assetsDir: "scripts",
    sourcemap: false,
  },
  resolve: {
    alias: {
      "@web-speed-hackathon-2026/client": path.resolve(__dirname),
      kuromoji: path.resolve(__dirname, "node_modules/kuromoji/build/kuromoji.js"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  define: {
    "process.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
    "process.env.COMMIT_HASH": JSON.stringify(process.env["SOURCE_VERSION"] ?? ""),
    "process.env.NODE_ENV": JSON.stringify(process.env["NODE_ENV"] ?? "development"),
  },
});
