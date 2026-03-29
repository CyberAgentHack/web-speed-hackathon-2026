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
      url: new URL("/search", baseUrl).href,
    });
  } catch (err) {
    throw new Error("ページの読み込みに失敗したか、タイムアウトしました", { cause: err });
  }
  consola.debug("SearchPostFlowAction - navigate end");

  const flow = await startFlow(puppeteerPage);

  consola.debug("SearchPostFlowAction - timespan");
  await flow.startTimespan();
  {
    const primaryInput = playwrightPage.getByPlaceholder(
      "検索 (例: キーワード since:2025-01-01 until:2025-12-31)",
    );
    const fallbackInput = playwrightPage
      .locator('main input[placeholder*="検索"], main input[type="search"], main input[name="q"]')
      .first();

    try {
      const searchInput = (await primaryInput.count()) > 0 ? primaryInput : fallbackInput;
      await searchInput.waitFor({ timeout: 30 * 1000 });
      await searchInput.fill("写真");
    } catch (err) {
      throw new Error("検索クエリの入力に失敗しました", { cause: err });
    }
    try {
      const exactButton = playwrightPage.getByRole("button", { name: "検索" });
      const fuzzyButton = playwrightPage.getByRole("button", { name: /検索/ });
      const searchButton = (await exactButton.count()) > 0 ? exactButton : fuzzyButton;
      await searchButton.first().waitFor({ timeout: 30 * 1000 });
      await searchButton.click();
      await Promise.race([
        playwrightPage.waitForURL(/\/search\?q=/, { timeout: 30 * 1000 }),
        playwrightPage.locator("main h2").first().waitFor({ timeout: 30 * 1000 }),
        playwrightPage.getByText("検索結果が見つかりませんでした").first().waitFor({ timeout: 30 * 1000 }),
      ]);
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
