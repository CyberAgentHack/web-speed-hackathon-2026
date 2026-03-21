import type * as playwright from "playwright";
import type * as puppeteer from "puppeteer";

import { consola } from "../consola";
import { goTo } from "../utils/go_to";
import { startFlow } from "../utils/start_flow";

import { calculateHackathonScore } from "./utils/calculate_hackathon_score";

type Params = {
  baseUrl: string;
  playwrightPage: playwright.Page;
  puppeteerPage: puppeteer.Page;
};

export async function calculatePostPhotoPage({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  const flow = await startFlow(puppeteerPage);

  consola.debug("PostPhotoPage - navigate");
  await flow.startNavigation();
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL("/posts/fe6712a1-d9e4-4f6a-987d-e7d08b7f8a46?score=1", baseUrl).href,
    });
  } catch (err) {
    throw new Error("ページの読み込みに失敗したか、タイムアウトしました", { cause: err });
  }
  await flow.endNavigation();

  consola.debug("PostPhotoPage - navigate end");
  const {
    steps: [result],
  } = await flow.createFlowResult();

  const { breakdown, scoreX100 } = calculateHackathonScore(result!.lhr.audits, {
    isUserflow: false,
  });

  return {
    audits: result!.lhr.audits,
    breakdown,
    scoreX100,
  };
}
