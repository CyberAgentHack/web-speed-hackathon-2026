import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [nodePolyfills(), babel(), tailwindcss()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  test: {
    includeSource: ["src/**/*.ts"],
  },
});
