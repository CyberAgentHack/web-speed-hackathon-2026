import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@web-speed-hackathon-2026/server": path.resolve(__dirname, "."),
    },
  },
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
