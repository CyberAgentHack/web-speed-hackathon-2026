import path from "node:path";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@web-speed-hackathon-2026/client": path.resolve(__dirname),
    },
  },
  define: {
    "process.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
    "process.env.COMMIT_HASH": JSON.stringify(process.env.SOURCE_VERSION || ""),
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        ws: true,
      },
      "/images": { target: "http://localhost:3000" },
      "/movies": { target: "http://localhost:3000" },
      "/sounds": { target: "http://localhost:3000" },
      "/fonts": { target: "http://localhost:3000" },
      "/sprites": { target: "http://localhost:3000" },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist"),
    emptyOutDir: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
    process.env.ANALYZE && visualizer({ open: true, gzipSize: true }),
  ],
});
