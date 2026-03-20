import { setTimeout } from "node:timers/promises";

import type * as puppeteer from "puppeteer";

interface Params {
  puppeteerPage: puppeteer.Page;
}

interface Returns {
  [Symbol.asyncDispose](): Promise<void>;
  getJoinTime({ timeout }: { timeout: number }): Promise<number>;
}

export async function measureJoinTime({ puppeteerPage }: Params): Promise<Returns> {
  const { identifier } = await puppeteerPage.evaluateOnNewDocument(() => {
    // @ts-expect-error -- https://github.com/evanw/esbuild/issues/2605
    window["__name"] = (fn: unknown) => fn;

    function handleDOMContentLoaded() {
      for (const node of document.querySelectorAll("video")) {
        if (!(node instanceof HTMLVideoElement)) continue;
        node.addEventListener("playing", () => performance.mark("video-playing"), { once: true });
      }

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (!(node instanceof HTMLVideoElement)) continue;
            node.addEventListener("playing", () => performance.mark("video-playing"), {
              once: true,
            });
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    document.addEventListener("DOMContentLoaded", handleDOMContentLoaded);
  });

  return {
    async [Symbol.asyncDispose]() {
      await puppeteerPage.removeScriptToEvaluateOnNewDocument(identifier);
    },
    async getJoinTime({ timeout }: { timeout: number }): Promise<number> {
      const resultPromise = puppeteerPage
        .evaluate(async () => {
          return new Promise<string>((resolve) => {
            const entries = performance.getEntriesByName("video-playing");
            if (entries.length !== 0) {
              resolve(JSON.stringify(entries[0]!));
            } else {
              const observer = new PerformanceObserver((list) => {
                const entries = list.getEntriesByName("video-playing");
                if (entries.length !== 0) {
                  observer.disconnect();
                  resolve(JSON.stringify(entries[0]!));
                }
              });
              observer.observe({ entryTypes: ["mark"] });
            }
          });
        })
        .then((json) => {
          return (JSON.parse(json) as PerformanceEntry).startTime;
        });

      return await Promise.race([
        resultPromise,
        setTimeout(timeout).then(() => {
          throw new Error("再生時間の計測でタイムアウトになりました");
        }),
      ]);
    },
  };
}
