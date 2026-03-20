import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { analyzer } from "vite-bundle-analyzer";

export default defineConfig({
  plugins: [nodePolyfills(), babel(), analyzer()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  test: {
    includeSource: ["src/**/*.ts"],
  },
});
