import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@web-speed-hackathon-2026/client": path.resolve(__dirname, "."),
      "bayesian-bm25": path.resolve(__dirname, "node_modules/bayesian-bm25/dist/index.js"),
      "kuromoji": path.resolve(__dirname, "node_modules/kuromoji/build/kuromoji.js"),
      "@ffmpeg/ffmpeg": path.resolve(__dirname, "node_modules/@ffmpeg/ffmpeg/dist/esm/index.js"),
      "@imagemagick/magick-wasm/magick.wasm": path.resolve(__dirname, "node_modules/@imagemagick/magick-wasm/dist/magick.wasm"),
    },
  },
  define: {
    "import.meta.env.VITE_BUILD_DATE": JSON.stringify(new Date().toISOString()),
    "import.meta.env.VITE_COMMIT_HASH": JSON.stringify(process.env.SOURCE_VERSION || ""),
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
