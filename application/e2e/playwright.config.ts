import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env["E2E_BASE_URL"] ?? "http://localhost:3000";

// 共有状態を書き換えるE2Eが多いため、デフォルトは単一workerで安定性を優先します
const WORKERS = process.env["E2E_WORKERS"] ? Number(process.env["E2E_WORKERS"]) : 1;

export default defineConfig({
  globalSetup: "./globalSetup.ts",
  expect: {
    timeout: 60_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03,
    },
  },
  fullyParallel: false,
  workers: WORKERS,
  projects: [
    {
      name: "Desktop Chrome",
      testMatch: "**/src/**/*.test.ts",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  reporter: "list",
  retries: 1,
  testDir: "./src",
  timeout: 300_000,
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: "retain-on-failure",
    navigationTimeout: 30_000,
    actionTimeout: 30_000,
  },
  webServer: {
    command: "pnpm --dir .. build && pnpm --dir .. start",
    reuseExistingServer: true,
    timeout: 600_000,
    url: BASE_URL,
  },
});
