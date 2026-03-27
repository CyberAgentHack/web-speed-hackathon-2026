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

export async function calculatePostAudioPage({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  const flow = await startFlow(puppeteerPage);

  consola.debug("PostAudioPage - navigate");
  await flow.startNavigation();
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL("/posts/fefe75bd-1b7a-478c-8ecc-2c1ab38b821e", baseUrl).href,
    });
  } catch (err) {
    throw new Error("ページの読み込みに失敗したか、タイムアウトしました", { cause: err });
  }
  await flow.endNavigation();

  consola.debug("PostAudioPage - navigate end");
  const {
    steps: [result],
  } = await flow.createFlowResult();
  const audits = result!.lhr.audits;
  if (audits["first-contentful-paint"]?.numericValue == null) {
    throw new Error("NO_FCP: 音声つき投稿詳細ページ (/posts/fefe75bd-1b7a-478c-8ecc-2c1ab38b821e)");
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
