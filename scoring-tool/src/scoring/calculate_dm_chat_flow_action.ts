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
      url: new URL("/not-found", baseUrl).href,
    });
  } catch (err) {
    throw new Error("ページの読み込みに失敗したか、タイムアウトしました", { cause: err });
  }
  consola.debug("DmChatFlowAction - navigate end");

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

  // DMページに移動
  consola.debug("DmChatFlowAction - navigate to DM");
  try {
    const dmLink = playwrightPage.getByRole("link", { name: "DM" });
    await dmLink.click();
    await playwrightPage.waitForURL("**/dm", { timeout: 10 * 1000 });
  } catch (err) {
    throw new Error("DMページへの遷移に失敗しました", { cause: err });
  }
  consola.debug("DmChatFlowAction - navigate to DM end");

  const flow = await startFlow(puppeteerPage);

  consola.debug("DmChatFlowAction - timespan");
  await flow.startTimespan();
  {
    // 「新しくDMを始める」ボタンをクリック
    try {
      const newDmButton = playwrightPage.getByRole("button", { name: "新しくDMを始める" });
      await newDmButton.click();
      await playwrightPage
        .getByRole("heading", { name: "新しくDMを始める" })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      throw new Error("新しくDMを始めるモーダルの表示に失敗しました", { cause: err });
    }

    // 既存ユーザーを入力してDM開始
    try {
      const usernameInput = playwrightPage.getByRole("textbox", { name: "ユーザー名" });
      await usernameInput.pressSequentially("g63iaxn5c");
    } catch (err) {
      throw new Error("DM相手のユーザー名の入力に失敗しました", { cause: err });
    }

    try {
      const startDmButton = playwrightPage.getByRole("button", { name: "DMを開始" });
      await startDmButton.click();
      // DMスレッドページへ遷移
      await playwrightPage.waitForURL("**/dm/*", {
        timeout: 10 * 1000,
      });
    } catch (err) {
      throw new Error("DMスレッドへの遷移に失敗しました", { cause: err });
    }

    // メッセージを入力（複数行）
    try {
      const messageInput = playwrightPage.getByRole("textbox", { name: "内容" });
      await messageInput.pressSequentially("こんにちは！", { delay: 10 });
      await playwrightPage.keyboard.press("Shift+Enter");
      await messageInput.pressSequentially("Web Speed Hackathon 2026に参加しています。", {
        delay: 10,
      });
      await playwrightPage.keyboard.press("Shift+Enter");
      await messageInput.pressSequentially("パフォーマンス改善のアドバイスをお願いします！", {
        delay: 10,
      });
    } catch (err) {
      throw new Error("メッセージの入力に失敗しました", { cause: err });
    }

    // メッセージを送信
    try {
      await playwrightPage.keyboard.press("Enter");
    } catch (err) {
      throw new Error("メッセージの送信に失敗しました", { cause: err });
    }

    // メッセージが表示されるまで待機（送信完了確認）
    try {
      await playwrightPage
        .locator("li")
        .filter({ hasText: "パフォーマンス改善のアドバイスをお願いします！" })
        .waitFor({ timeout: 30 * 1000 });
    } catch (err) {
      throw new Error("メッセージの送信完了を待機中にタイムアウトしました", { cause: err });
    }

    // 追加のメッセージを入力
    try {
      const messageInput = playwrightPage.getByRole("textbox", { name: "内容" });
      await messageInput.pressSequentially("追加の質問です。", { delay: 10 });
      await playwrightPage.keyboard.press("Shift+Enter");
      await messageInput.pressSequentially("LCPの改善方法を具体的に教えてください。", {
        delay: 10,
      });
    } catch (err) {
      throw new Error("追加メッセージの入力に失敗しました", { cause: err });
    }

    // 2通目のメッセージを送信
    try {
      await playwrightPage.keyboard.press("Enter");
    } catch (err) {
      throw new Error("2通目のメッセージの送信に失敗しました", { cause: err });
    }

    // 2通目のメッセージが表示されるまで待機
    try {
      await playwrightPage
        .locator("li")
        .filter({ hasText: "LCPの改善方法を具体的に教えてください。" })
        .waitFor({ timeout: 30 * 1000 });
    } catch (err) {
      throw new Error("2通目のメッセージの送信完了を待機中にタイムアウトしました", { cause: err });
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
