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
  const responseStartTimeout = 60 * 1000;

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
  consola.debug("CrokChatFlowAction - signin");
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
    await usernameInput.pressSequentially("o6yq16leo");
  } catch (err) {
    throw new Error("ユーザー名の入力に失敗しました", { cause: err });
  }
  try {
    const passwordInput = playwrightPage
      .getByRole("dialog")
      .getByRole("textbox", { name: "パスワード" });
    await passwordInput.pressSequentially("wsh-2026");
  } catch (err) {
    throw new Error("パスワードの入力に失敗しました", { cause: err });
  }
  try {
    const submitButton = playwrightPage
      .getByRole("dialog")
      .getByRole("button", { name: "サインイン" });
    await submitButton.last().click();
    await playwrightPage.getByRole("link", { name: "Crok" }).waitFor({ timeout: 30 * 1000 });
  } catch (err) {
    throw new Error("サインインに失敗しました", { cause: err });
  }
  consola.debug("CrokChatFlowAction - signin end");

  // Crokページに移動
  consola.debug("CrokChatFlowAction - navigate to Crok");
  try {
    const crokLink = playwrightPage.getByRole("link", { name: "Crok" });
    await crokLink.click();
    await playwrightPage.waitForURL("**/crok", { timeout: 10 * 1000 });
  } catch (err) {
    throw new Error("Crokページへの遷移に失敗しました", { cause: err });
  }
  consola.debug("CrokChatFlowAction - navigate to Crok end");

  const flow = await startFlow(puppeteerPage);

  consola.debug("CrokChatFlowAction - timespan");
  await flow.startTimespan();
  {
    // メッセージを入力して送信
    try {
      const chatInput = playwrightPage.getByPlaceholder("メッセージを入力...");
      await chatInput.pressSequentially("TypeScriptのtemplate literal typeとは何ですか");
    } catch (err) {
      throw new Error("チャット入力欄へのテキスト入力に失敗しました", { cause: err });
    }

    const responseStarted = playwrightPage.waitForResponse(
      (response) => response.url().includes("/api/v1/crok?prompt=") && response.status() === 200,
      { timeout: responseStartTimeout },
    );

    try {
      const sendButton = playwrightPage.getByRole("button", { name: "送信" });
      await sendButton.click();
    } catch (err) {
      throw new Error("送信ボタンのクリックに失敗しました", { cause: err });
    }

    // ストリーミング開始を待機
    try {
      await playwrightPage.getByRole("status", { name: "応答中" }).waitFor({ timeout: 60 * 1000 });
    } catch (err) {
      throw new Error("AIレスポンスのローディング表示に失敗しました", { cause: err });
    }

    // 長文SSEの全文完了は環境差で揺れやすいので、SSE接続開始をもって計測完了にする
    try {
      await responseStarted;
    } catch (err) {
      throw new Error("レスポンス内容が正しく表示されなかったか、タイムアウトしました", {
        cause: err,
      });
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
