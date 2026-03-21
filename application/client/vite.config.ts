import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { join } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig(async () => {
  const visualizer = (await import("rollup-plugin-visualizer")).default;
  return {
    server: {
      proxy: {
        "/api": { target: "http://localhost:3000", ws: true },
        "/images": "http://localhost:3000",
        "/movies": "http://localhost:3000",
        "/sounds": "http://localhost:3000",
      },
    },
    build: {
      outDir: "../dist",
    },
    optimizeDeps: {
      exclude: ["@ffmpeg/ffmpeg"],
    },
    assetsInclude: ["**/*.wasm?binary"],
    publicDir: join(import.meta.dirname, "../public"),
    plugins: [
      visualizer({
        open: true,
      }),
      // analyzer(),
      tailwindcss(),
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      // babel({
      //   presets: [reactCompilerPreset()]
      // })
    ],
  };
});
