import { setTimeout } from "node:timers/promises";

import type * as playwright from "playwright";
import type * as puppeteer from "puppeteer";
import { ResourceWatcher } from "storycrawler";

type Params = {
  playwrightPage: playwright.Page;
  puppeteerPage: puppeteer.Page;
  timeout?: number;
  url: string;
};

export async function goTo({ playwrightPage, puppeteerPage, timeout, url }: Params) {
  // @ts-expect-error
  const watcher = new ResourceWatcher(puppeteerPage).init();

  await Promise.race([
    playwrightPage
      .goto(url, { waitUntil: "networkidle" })
      .catch(() => {})
      .then(() => {
        // `/api/v1/me` APIはエラーを返す可能性があるので無視する
        const ignoredUrls = watcher.getRequestedUrls().filter((url) => url.includes("/api/v1/me"));
        for (const url of ignoredUrls) {
          (watcher["resolvedAssetsMap"] as Map<unknown, unknown>).delete(url);
        }
      })
      .then(() => {
        return watcher.waitForRequestsComplete();
      }),
    setTimeout(timeout).then(() => {
      throw new Error("ページの読み込みがタイムアウトしました");
    }),
  ]);

  watcher.clear();
}
