import { startFlow as startFlowOrig } from "lighthouse";
import type * as puppeteer from "puppeteer";

export async function startFlow(page: puppeteer.Page) {
  return startFlowOrig(page, {
    config: {
      extends: "lighthouse:default",
      settings: {
        disableFullPageScreenshot: true,
        disableStorageReset: true,
        formFactor: "desktop",
        // 旧挙動に戻す（計測の取りこぼしを減らす）
        maxWaitForFcp: 120 * 1000,
        maxWaitForLoad: 180 * 1000,
        onlyAudits: [
          "first-contentful-paint",
          "speed-index",
          "largest-contentful-paint",
          "largest-contentful-paint-element",
          "total-blocking-time",
          "cumulative-layout-shift",
          "interaction-to-next-paint",
        ],
        screenEmulation: {
          disabled: true,
        },
        throttlingMethod: "simulate",
      },
    },
  }).catch(() => Promise.reject(new Error("Lighthouse がタイムアウトしました")));
}
