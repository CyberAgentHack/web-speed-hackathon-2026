import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

import debug from "debug";
import * as playwright from "playwright";
import * as puppeteer from "puppeteer";

type Params = {
  device: Partial<(typeof playwright.devices)[string]>;
};

async function allocateFreePort() {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (typeof address !== "object" || address == null) {
        server.close();
        reject(new Error("Failed to allocate a free port"));
        return;
      }

      const { port } = address;
      server.close((err) => {
        if (err != null) {
          reject(err);
          return;
        }
        resolve(port);
      });
    });
  });
}

export async function createPage({ device }: Params) {
  const userDataDir = await fs.mkdtemp(path.resolve(os.tmpdir(), "playwright-"));
  const remoteDebuggingPort = await allocateFreePort();

  const playwrightContext = await playwright.chromium.launchPersistentContext(userDataDir, {
    args: [`--remote-debugging-port=${remoteDebuggingPort}`],
    channel: "chrome",
    devtools: false,
    headless: !debug.enabled("wsh:browser"),
    ...device,
  });

  const playwrightPage = playwrightContext.pages()[0]!;
  await playwrightPage.goto("about:blank");

  const puppeteerBrowser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${remoteDebuggingPort}`,
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
