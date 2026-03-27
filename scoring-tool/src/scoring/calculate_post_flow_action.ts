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
export async function calculatePostFlowAction({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  consola.debug("PostFlowAction - navigate");
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL("/", baseUrl).href,
    });
  } catch (err) {
    throw new Error("ページの読み込みに失敗したか、タイムアウトしました", { cause: err });
  }
  consola.debug("PostFlowAction - navigate end");

  // サインイン
  consola.debug("DmChatFlowAction - signin");
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
    await submitButton.click();
    await playwrightPage.getByRole("link", { name: "マイページ" }).waitFor({ timeout: 10 * 1000 });
  } catch (err) {
    throw new Error("サインインに失敗しました", { cause: err });
  }
  consola.debug("DmChatFlowAction - signin end");

  const flow = await startFlow(puppeteerPage);

  consola.debug("PostFlowAction - timespan");
  await flow.startTimespan();
  const marker = `${Date.now()}`;
  // テキストの投稿
  {
    try {
      const postButton = playwrightPage.getByRole("button", { name: "投稿する" });
      await postButton.click();
      await playwrightPage
        .getByRole("dialog", { name: "新規投稿" })
        .waitFor({ timeout: 120 * 1000 });
    } catch (err) {
      throw new Error("投稿モーダルの表示に失敗しました", { cause: err });
    }
    try {
      const contentInput = playwrightPage
        .getByRole("dialog", { name: "新規投稿" })
        .getByRole("textbox", { name: "いまなにしてる？" });
      await contentInput.fill(`スコア計測用のテキスト投稿 ${marker}`);
    } catch (err) {
      throw new Error("投稿内容の入力に失敗しました", { cause: err });
    }
    try {
      const submitButton = playwrightPage
        .getByRole("dialog", { name: "新規投稿" })
        .getByRole("button", { name: "投稿する" });
      await submitButton.click();
      await playwrightPage.waitForURL("**/posts/*", { timeout: 120 * 1000 });
      await playwrightPage
        .getByRole("article")
        .getByText(`スコア計測用のテキスト投稿 ${marker}`)
        .waitFor({ timeout: 120 * 1000 });
    } catch (err) {
      throw new Error("投稿の完了を確認できませんでした", { cause: err });
    }
  }
  await flow.endTimespan();
  consola.debug("PostFlowAction - timespan end");

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
