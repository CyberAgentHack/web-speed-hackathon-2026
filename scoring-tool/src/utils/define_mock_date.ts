import fsp from "node:fs/promises";
import { createRequire } from "node:module";

import { stripIndent } from "common-tags";
import type * as puppeteer from "puppeteer";

const require = createRequire(import.meta.url);

interface Params {
  date: Date;
  puppeteerPage: puppeteer.Page;
}

interface Returns {
  [Symbol.asyncDispose](): Promise<void>;
}

export async function defineMockDate({ date, puppeteerPage }: Params): Promise<Returns> {
  const { identifier } = await puppeteerPage.evaluateOnNewDocument(
    stripIndent /* javascript */ `
      ${await fsp.readFile(require.resolve("mockdate/lib/mockdate.js"), "utf-8")};;
      MockDate.set(${JSON.stringify(date.toISOString())});
    `,
  );

  return {
    async [Symbol.asyncDispose]() {
      await puppeteerPage.removeScriptToEvaluateOnNewDocument(identifier);
    },
  };
}
