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
      url: new URL("/not-found", baseUrl).href,
    });
  } catch (err) {
    throw new Error("ページの読み込みに失敗したか、タイムアウトしました", { cause: err });
  }
  consola.debug("CrokChatFlowAction - navigate end");

  // サインイン
  try {
    const signinButton = playwrightPage.getByRole("button", { name: "サインイン" });
    await signinButton.click();
    await playwrightPage
      .getByRole("dialog")
      .getByRole("heading", { name: "サインイン" })
      .waitFor({ timeout: 10 * 1000 });
  } catch (err) {
    throw new Error("サインインモーダルの表示に失敗しました", { cause: err });
  }
  try {
    const usernameInput = playwrightPage
      .getByRole("dialog")
      .getByRole("textbox", { name: "ユーザー名" });
    await usernameInput.fill("o6yq16leo");
  } catch (err) {
    throw new Error("ユーザー名の入力に失敗しました", { cause: err });
  }
  try {
    const passwordInput = playwrightPage
      .getByRole("dialog")
      .getByRole("textbox", { name: "パスワード" });
    await passwordInput.fill("wsh-2026");
  } catch (err) {
    throw new Error("パスワードの入力に失敗しました", { cause: err });
  }
  try {
    const submitButton = playwrightPage
      .getByRole("dialog")
      .getByRole("button", { name: "サインイン" });
    await submitButton.click();
    await playwrightPage.getByRole("link", { name: "Crok" }).waitFor({ timeout: 10 * 1000 });
  } catch (err) {
    throw new Error("サインインに失敗しました", { cause: err });
  }

  try {
    await playwrightPage.getByRole("link", { name: "Crok" }).click();
    await playwrightPage.waitForURL("**/crok", { timeout: 10 * 1000 });
  } catch (err) {
    throw new Error("Crokページへの遷移に失敗しました", { cause: err });
  }

  const flow = await startFlow(puppeteerPage);

  consola.debug("CrokChatFlowAction - timespan");
  await flow.startTimespan();
  {
    const prompt = `TypeScript ${Date.now()}`;

    // メッセージを入力して送信
    try {
      const chatInput = playwrightPage.getByPlaceholder("メッセージを入力...");
      await chatInput.fill(prompt);
    } catch (err) {
      throw new Error("チャット入力欄へのテキスト入力に失敗しました", { cause: err });
    }

    try {
      await Promise.race([
        playwrightPage.getByRole("listbox", { name: "サジェスト候補" }).waitFor({
          timeout: 30 * 1000,
        }),
        playwrightPage.getByRole("button", { name: "送信" }).waitFor({ timeout: 30 * 1000 }),
      ]);
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
