import os from "node:os";

import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env["E2E_BASE_URL"] ?? "http://localhost:3000";

// PCスペックやチューニングの進み具合によってテストの安定性が変わるため、E2E_WORKERSの数を調整しながら利用してください
// デフォルトでは、論理CPUの数の半分を利用します
const WORKERS = 2;

export default defineConfig({
    globalSetup: "./globalSetup.ts",
    expect: {
        timeout: 60_000,
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.03,
        },
    },
    fullyParallel: true,
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
        trace: "off",
        navigationTimeout: 30_000,
        actionTimeout: 30_000,
    },
});
