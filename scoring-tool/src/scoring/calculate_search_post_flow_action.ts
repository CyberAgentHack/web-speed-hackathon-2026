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
    consola.error("SearchPostFlowAction - goTo /search failed:", err);
  }
  consola.debug("SearchPostFlowAction - navigate end");

  const flow = await startFlow(puppeteerPage);

  // 1回目の検索（準備）は timespan 外で実行して、長い入力操作で Lighthouse が不安定にならないようにする
  try {
    const searchInput = playwrightPage.getByRole("textbox", {
      name: "検索 (例: キーワード since:2025-01-01 until:2025-12-31)",
    });
    await searchInput.waitFor({ state: "visible", timeout: 10 * 1000 });
    await searchInput.fill("アニメ since:2026-01-06 until:2026-01-20");

    const searchButton = playwrightPage.getByRole("button", { name: "検索" });
    await searchButton.click();
    await playwrightPage.getByRole("heading", { name: /「アニメ/ }).waitFor({ timeout: 120 * 1000 });
  } catch (err) {
    consola.error("SearchPostFlowAction - first search failed:", err);
  }

  // timespan は 2 回目のクリック〜結果待ちだけに絞って計測を安定化
  consola.debug("SearchPostFlowAction - timespan");
  await flow.startTimespan();
  try {
    const searchInput = playwrightPage.getByRole("textbox", {
      name: "検索 (例: キーワード since:2025-01-01 until:2025-12-31)",
    });
    await searchInput.waitFor({ state: "visible", timeout: 10 * 1000 });
    // 2回目も同じクエリに揃えて結果が出る前提を作る（見つからない待ちで固まるのを防ぐ）
    await searchInput.fill("アニメ since:2026-01-06 until:2026-01-20");

    const searchButton = playwrightPage.getByRole("button", { name: "検索" });
    await searchButton.click();
    await playwrightPage.getByRole("heading", { name: /「アニメ/ }).waitFor({ timeout: 30 * 1000 });
  } catch (err) {
    consola.error("SearchPostFlowAction - second search failed:", err);
  }
  await flow.endTimespan();
  consola.debug("SearchPostFlowAction - timespan end");

  try {
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
  } catch (err) {
    consola.error("SearchPostFlowAction - createFlowResult failed:", err);
    const { breakdown, scoreX100 } = calculateHackathonScore({} as any, { isUserflow: true });
    return {
      audits: {} as any,
      breakdown,
      scoreX100,
    };
  }
}
