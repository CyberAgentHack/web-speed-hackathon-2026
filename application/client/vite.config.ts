import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

function asyncCssPlugin(): Plugin {
  return {
    name: "async-css",
    enforce: "post",
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/,
        `<style>body{background-color:#f5f5f4}</style>
    <link rel="preload" as="style" crossorigin href="$1" onload="this.rel='stylesheet'">
    <noscript><link rel="stylesheet" crossorigin href="$1"></noscript>`,
      );
    },
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    asyncCssPlugin(),
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
    },
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
