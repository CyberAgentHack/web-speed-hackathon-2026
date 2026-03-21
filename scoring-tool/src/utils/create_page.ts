import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import debug from "debug";
import * as playwright from "playwright";
import * as puppeteer from "puppeteer";

type Params = {
  device: Partial<(typeof playwright.devices)[string]>;
};

export async function createPage({ device }: Params) {
  const userDataDir = await fs.mkdtemp(path.resolve(os.tmpdir(), "playwright-"));

  const debugPort = process.env["CHROME_DEBUG_PORT"] || "9222";
  const chromiumPath = process.env["CHROMIUM_PATH"] || "chromium";
  const playwrightContext = await playwright.chromium.launchPersistentContext(userDataDir, {
    args: [`--remote-debugging-port=${debugPort}`],
    executablePath: chromiumPath,
    devtools: false,
    headless: !debug.enabled("wsh:browser"),
    ...device,
  });

  const playwrightPage = playwrightContext.pages()[0]!;
  await playwrightPage.goto("about:blank");

  const puppeteerBrowser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${debugPort}`,
    defaultViewport: {
      deviceScaleFactor: device.deviceScaleFactor!,
      hasTouch: device.hasTouch!,
      height: device.viewport!.height,
      isMobile: device.isMobile!,
      width: device.viewport!.width,
    },
  });
  const puppeteerPage = (await puppeteerBrowser.pages())[0]!;

  return {
    [Symbol.asyncDispose]: async function () {
      await playwrightContext.close();
      await fs.rm(userDataDir, { recursive: true });
    },
    playwrightPage,
    puppeteerPage,
  };
}
