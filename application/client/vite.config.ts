import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { join } from "node:path";
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
      react(),
      tailwindcss(),
      // babel({
      //   presets: [reactCompilerPreset()]
      // })
    ],
  };
});
