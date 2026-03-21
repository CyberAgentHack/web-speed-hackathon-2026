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
      url: new URL("/posts/fe6712a1-d9e4-4f6a-987d-e7d08b7f8a46", baseUrl).href,
    });
  } catch (err) {
    throw new Error("ページの読み込みに失敗したか、タイムアウトしました", { cause: err });
  }
  await flow.endNavigation();

  consola.debug("PostPhotoPage - navigate end");
  const {
    steps: [result],
  } = await flow.createFlowResult();
  const audits = result!.lhr.audits;
  if (audits["first-contentful-paint"]?.numericValue == null) {
    throw new Error("NO_FCP: 写真つき投稿詳細ページ (/posts/fe6712a1-d9e4-4f6a-987d-e7d08b7f8a46)");
  }

  const { breakdown, scoreX100 } = calculateHackathonScore(audits, {
    isUserflow: false,
  });

  return {
    audits,
    breakdown,
    scoreX100,
  };
}
