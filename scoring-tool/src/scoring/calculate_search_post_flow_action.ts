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
export async function calculateSearchPostFlowAction({
  baseUrl,
  playwrightPage,
  puppeteerPage,
}: Params) {
  consola.debug("SearchPostFlowAction - navigate");
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL("/search?score=1", baseUrl).href,
    });
  } catch (err) {
    throw new Error("ページの読み込みに失敗したか、タイムアウトしました", { cause: err });
  }
  consola.debug("SearchPostFlowAction - navigate end");

  const flow = await startFlow(puppeteerPage);

  consola.debug("SearchPostFlowAction - timespan");
  await flow.startTimespan();
  {
    try {
      const searchInput = playwrightPage.locator("#fast-search-input");
      await searchInput.click();
      await searchInput.pressSequentially("abc", { delay: 0 });
    } catch (err) {
      throw new Error("検索クエリの入力に失敗しました", { cause: err });
    }
    try {
      const searchButton = playwrightPage.locator("#fast-search-button");
      await searchButton.click();
      await playwrightPage.locator("#fast-search-result", { hasText: "検索結果" }).waitFor({
        timeout: 30 * 1000,
      });
    } catch (err) {
      throw new Error("検索結果の表示に失敗しました", { cause: err });
    }
  }
  await flow.endTimespan();
  consola.debug("SearchPostFlowAction - timespan end");

  const {
    steps: [result],
  } = await flow.createFlowResult();

  const { breakdown, scoreX100 } = calculateHackathonScore(result!.lhr.audits, {
    isUserflow: true,
  });

  return {
    audits: result!.lhr.audits,
    breakdown,
    scoreX100,
  };
}
