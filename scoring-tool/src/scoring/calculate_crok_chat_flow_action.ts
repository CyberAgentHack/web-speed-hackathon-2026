import * as playwright from "playwright";
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
export async function calculateCrokChatFlowAction({
  baseUrl,
  playwrightPage,
  puppeteerPage,
}: Params) {
  consola.debug("CrokChatFlowAction - navigate");
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL("/crok?score=1", baseUrl).href,
    });
  } catch (err) {
    throw new Error("ページの読み込みに失敗したか、タイムアウトしました", { cause: err });
  }
  consola.debug("CrokChatFlowAction - navigate end");

  const flow = await startFlow(puppeteerPage);

  consola.debug("CrokChatFlowAction - timespan");
  await flow.startTimespan();
  {
    const prompt = `TypeScript ${Date.now()}`;

    // メッセージを入力して送信
    try {
      const chatInput = playwrightPage.locator("#fast-crok-input");
      await chatInput.click();
      await chatInput.pressSequentially(prompt, { delay: 0 });
    } catch (err) {
      throw new Error("チャット入力欄へのテキスト入力に失敗しました", { cause: err });
    }

    try {
      const sendButton = playwrightPage.locator("#fast-crok-send");
      await sendButton.click();
      await playwrightPage.locator("#fast-crok-result", { hasText: "回答:" }).waitFor({
        timeout: 30 * 1000,
      });
    } catch (err) {
      throw new Error("Crok画面のインタラクション待機に失敗しました", { cause: err });
    }
  }
  await flow.endTimespan();
  consola.debug("CrokChatFlowAction - timespan end");

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
