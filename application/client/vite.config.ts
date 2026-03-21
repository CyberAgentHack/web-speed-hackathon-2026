import path from "node:path";

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
  define: {
    "process.env": JSON.stringify({
      BUILD_DATE: new Date().toISOString(),
      COMMIT_HASH: process.env.SOURCE_VERSION || "",
      NODE_ENV: "production",
    }),
  },
  plugins: [
    tailwindcss(),
    react(),
    nodePolyfills({
      include: ["buffer", "process"],
    }),
  ],
  resolve: {
    alias: {
      "@web-speed-hackathon-2026/client": path.resolve(__dirname),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  ssr: {
    noExternal: true,
  },
});
