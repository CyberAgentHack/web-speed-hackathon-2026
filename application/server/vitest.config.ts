import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@web-speed-hackathon-2026/server": resolve(import.meta.dirname, "."),
    },
  },
  test: {
    root: import.meta.dirname,
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
  },
});
