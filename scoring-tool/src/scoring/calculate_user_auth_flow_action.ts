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
export async function calculateUserAuthFlowAction({
  baseUrl,
  playwrightPage,
  puppeteerPage,
}: Params) {
  consola.debug("UserAuthFlowAction - navigate");
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
  consola.debug("UserAuthFlowAction - navigate end");

  const flow = await startFlow(puppeteerPage);

  consola.debug("UserAuthFlowAction - timespan");
  await flow.startTimespan();
  {
    // 新規登録
    try {
      const button = playwrightPage.getByRole("button", { name: "サインイン" });
      await button.click();
      await playwrightPage
        .getByRole("dialog")
        .getByRole("heading", { name: "サインイン" })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error("サインインモーダルの表示に失敗しました", { cause: err });
    }
    try {
      const button = playwrightPage
        .getByRole("dialog")
        .getByRole("button", { name: "初めての方はこちら" });
      await button.click();
      await playwrightPage
        .getByRole("dialog")
        .getByRole("heading", { name: "新規登録" })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error("新規登録モーダルへの遷移に失敗しました", { cause: err });
    }
    try {
      const input = playwrightPage.getByRole("dialog").getByRole("textbox", { name: "ユーザー名" });
      await input.pressSequentially("superultrahypermiracleromantic", { delay: 10 });
    } catch (err) {
      throw new Error("ユーザー名の入力に失敗しました", { cause: err });
    }
    try {
      const input = playwrightPage.getByRole("dialog").getByRole("textbox", { name: "名前" });
      await input.pressSequentially("superultrahypermiracleromantic", { delay: 10 });
    } catch (err) {
      throw new Error("名前の入力に失敗しました", { cause: err });
    }
    try {
      const input = playwrightPage.getByRole("dialog").getByRole("textbox", { name: "パスワード" });
      await input.pressSequentially("superultra_hyper_miracle_romantic", { delay: 10 });
    } catch (err) {
      throw new Error("パスワードの入力に失敗しました", { cause: err });
    }
    try {
      const button = playwrightPage.getByRole("dialog").getByRole("button", { name: "登録する" });
      await button.click();
      await playwrightPage
        .getByRole("link", { name: "マイページ" })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error("新規登録に失敗しました", { cause: err });
    }
  }

  // サインアウト
  {
    try {
      const button = playwrightPage.getByRole("button", { name: "アカウントメニュー" });
      await button.click();
    } catch (err) {
      throw new Error("アカウントメニューの表示に失敗しました", { cause: err });
    }
    try {
      const button = playwrightPage.getByRole("button", { name: "サインアウト" });
      await button.click();
      await playwrightPage
        .getByRole("button", { name: "サインイン" })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error("サインアウトに失敗しました", { cause: err });
    }
  }

  // サインイン
  {
    try {
      const button = playwrightPage.getByRole("button", { name: "サインイン" });
      await button.click();
    } catch (err) {
      throw new Error("サインインモーダルの表示に失敗しました", { cause: err });
    }
    try {
      const input = playwrightPage.getByRole("dialog").getByRole("textbox", { name: "ユーザー名" });
      await input.pressSequentially("superultrahypermiracleromantic", { delay: 10 });
    } catch (err) {
      throw new Error("ユーザー名の入力に失敗しました", { cause: err });
    }
    try {
      const input = playwrightPage.getByRole("dialog").getByRole("textbox", { name: "パスワード" });
      await input.pressSequentially("superultra_hyper_miracle_romantic", { delay: 10 });
    } catch (err) {
      throw new Error("パスワードの入力に失敗しました", { cause: err });
    }
    try {
      const button = playwrightPage.getByRole("dialog").getByRole("button", { name: "サインイン" });
      await button.click();
      await playwrightPage
        .getByRole("link", { name: "マイページ" })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error("サインインに失敗しました", { cause: err });
    }
  }
  await flow.endTimespan();
  consola.debug("UserAuthFlowAction - timespan end");

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
