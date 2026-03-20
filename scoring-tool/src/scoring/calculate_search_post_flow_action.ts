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
    try {
      const searchInput = playwrightPage.getByRole("textbox", {
        name: "検索 (例: キーワード since:2025-01-01 until:2025-12-31)",
      });
      await searchInput.pressSequentially(`アニメ since:2026-01-06${"0".repeat(20)}x`);
    } catch (err) {
      throw new Error("検索クエリの入力に失敗しました", { cause: err });
    }
    try {
      const searchButton = playwrightPage.getByRole("button", { name: "検索" });
      await searchButton.click();
      await playwrightPage
        .getByRole("heading", { name: /「アニメ/ })
        .waitFor({ timeout: 120 * 1000 });
    } catch (err) {
      throw new Error("検索結果の表示に失敗しました", { cause: err });
    }

    try {
      const searchInput = playwrightPage.getByRole("textbox", {
        name: "検索 (例: キーワード since:2025-01-01 until:2025-12-31)",
      });
      await searchInput.clear();
      await searchInput.pressSequentially(
        `アニメ since:2026-01-06${"0".repeat(10)}x until:2026-01-06${"0".repeat(10)}x`,
      );
    } catch (err) {
      throw new Error("検索クエリの追加入力に失敗しました", { cause: err });
    }
    try {
      const searchButton = playwrightPage.getByRole("button", { name: "検索" });
      await searchButton.click();
      await playwrightPage
        .getByRole("heading", { name: /「アニメ/ })
        .waitFor({ timeout: 120 * 1000 });
    } catch (err) {
      throw new Error("追加検索結果の表示に失敗しました", { cause: err });
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
