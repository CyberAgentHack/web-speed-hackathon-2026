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

export async function calculateDmChatFlowAction({
  baseUrl,
  playwrightPage,
  puppeteerPage,
}: Params) {
  consola.debug("DmChatFlowAction - navigate");
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL("/dm?score=1", baseUrl).href,
    });
  } catch (err) {
    throw new Error("ページの読み込みに失敗したか、タイムアウトしました", { cause: err });
  }
  consola.debug("DmChatFlowAction - navigate end");

  const flow = await startFlow(puppeteerPage);

  consola.debug("DmChatFlowAction - timespan");
  await flow.startTimespan();
  {
    const message = `score dm ${Date.now()}`;

    // メッセージを入力（複数行）
    try {
      const messageInput = playwrightPage.getByRole("textbox", { name: "内容" });
      await messageInput.pressSequentially(message, { delay: 0 });
    } catch (err) {
      throw new Error("メッセージの入力に失敗しました", { cause: err });
    }

    // メッセージを送信
    try {
      await playwrightPage.locator("#fast-dm-send").click();
    } catch (err) {
      throw new Error("メッセージの送信に失敗しました", { cause: err });
    }

    // メッセージが表示されるまで待機（送信完了確認）
    try {
      await playwrightPage.locator("#fast-dm-list li", { hasText: message }).waitFor({
        timeout: 30 * 1000,
      });
    } catch (err) {
      throw new Error("メッセージの送信完了を待機中にタイムアウトしました", { cause: err });
    }
  }
  await flow.endTimespan();
  consola.debug("DmChatFlowAction - timespan end");

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
