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
        // ユーザーフローは “待ち” が長いと固まりやすいので短縮する
        maxWaitForFcp: 60 * 1000,
        maxWaitForLoad: 90 * 1000,
        onlyAudits: [
          "first-contentful-paint",
          "speed-index",
          "largest-contentful-paint",
          "largest-contentful-paint-element",
          "total-blocking-time",
          // TBT が 0 点に張り付くときの内訳確認用
          "long-tasks",
          "mainthread-work-breakdown",
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
