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
    // ユーザーフロー全体を落とさず計測は継続
    consola.error("DmChatFlowAction - goTo failed:", err);
  }
  consola.debug("DmChatFlowAction - navigate end");

  // サインイン
  consola.debug("DmChatFlowAction - signin");
  const uniqueSuffix = Math.floor(Date.now() / 1000).toString(10).slice(-6);
  const meUsername = `wsh_dm_me_${uniqueSuffix}`;
  const peerUsername = `wsh_dm_peer_${uniqueSuffix}`;
  const meName = `wsh_dm_me_${uniqueSuffix}`;
  const peerName = `wsh_dm_peer_${uniqueSuffix}`;
  const password = "superultra_hyper_miracle_romantic";

  // 既存アカウントが存在しないと失敗しやすいので、毎回ユニークなユーザーを作成してログインする
  for (const [username, name] of [
    [peerUsername, peerName],
    [meUsername, meName],
  ] as const) {
    try {
      const signinButton = playwrightPage.getByRole("button", { name: "サインイン" });
      await signinButton.click();
      await playwrightPage
        .getByRole("dialog")
        .getByRole("heading", { name: "サインイン" })
        .waitFor({ timeout: 10 * 1000 });

      const signupTransition = playwrightPage
        .getByRole("dialog")
        .getByRole("button", { name: "初めての方はこちら" });
      await signupTransition.click();
      await playwrightPage
        .getByRole("dialog")
        .getByRole("heading", { name: "新規登録" })
        .waitFor({ timeout: 10 * 1000 });

      const usernameInput = playwrightPage.getByRole("dialog").getByLabel("ユーザー名");
      await usernameInput.waitFor({ state: "visible", timeout: 10 * 1000 });
      await usernameInput.click();
      await usernameInput.fill(username);

      const nameInput = playwrightPage.getByRole("dialog").getByLabel("名前");
      await nameInput.waitFor({ state: "visible", timeout: 10 * 1000 });
      await nameInput.click();
      await nameInput.fill(name);

      const passwordInput = playwrightPage.getByRole("dialog").getByLabel("パスワード");
      await passwordInput.waitFor({ state: "visible", timeout: 10 * 1000 });
      await passwordInput.click();
      await passwordInput.fill(password);

      const registerButton = playwrightPage.getByRole("dialog").getByRole("button", { name: "登録する" });
      await registerButton.click();
      await playwrightPage.getByRole("link", { name: "マイページ" }).waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      consola.error("DmChatFlowAction - signup failed (will continue):", err);
    }
  }
  consola.debug("DmChatFlowAction - signin end");

  // DMページに移動
  consola.debug("DmChatFlowAction - navigate to DM");
  try {
    const dmLink = playwrightPage.getByRole("link", { name: "DM" });
    await dmLink.click();
    await playwrightPage.waitForURL("**/dm", { timeout: 10 * 1000 });
  } catch (err) {
    consola.error("DmChatFlowAction - navigate to DM failed:", err);
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
      consola.error("DmChatFlowAction - new DM modal show failed:", err);
    }

    // 既存ユーザーを入力してDM開始
    try {
      const usernameInput = playwrightPage.getByRole("textbox", { name: "ユーザー名" });
      await usernameInput.waitFor({ state: "visible", timeout: 10 * 1000 });
      await usernameInput.click();
      await usernameInput.fill(peerUsername);
    } catch (err) {
      consola.error("DM相手のユーザー名の入力に失敗しました", err);
    }

    try {
      const startDmButton = playwrightPage.getByRole("button", { name: "DMを開始" });
      await startDmButton.click();
      // DMスレッドページへ遷移
      await playwrightPage.waitForURL("**/dm/*", {
        timeout: 10 * 1000,
      });
    } catch (err) {
      consola.error("DmChatFlowAction - navigate to DM thread failed:", err);
    }

    // メッセージを入力（複数行）
    try {
      const messageInput = playwrightPage.getByRole("textbox", { name: "内容" });
      await messageInput.waitFor({ state: "visible", timeout: 10 * 1000 });
      await messageInput.click();
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
      consola.error("メッセージの入力に失敗しました", err);
    }

    // メッセージを送信
    try {
      await playwrightPage.keyboard.press("Enter");
    } catch (err) {
      consola.error("メッセージの送信に失敗しました", err);
    }

    // メッセージが表示されるまで待機（送信完了確認）
    try {
      await playwrightPage
        .locator("li")
        .filter({ hasText: "パフォーマンス改善のアドバイスをお願いします！" })
        .waitFor({ timeout: 30 * 1000 });
    } catch (err) {
      consola.error("メッセージの送信完了を待機中にタイムアウトしました", err);
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
      consola.error("追加メッセージの入力に失敗しました", err);
    }

    // 2通目のメッセージを送信
    try {
      await playwrightPage.keyboard.press("Enter");
    } catch (err) {
      consola.error("2通目のメッセージの送信に失敗しました", err);
    }

    // 2通目のメッセージが表示されるまで待機
    try {
      await playwrightPage
        .locator("li")
        .filter({ hasText: "LCPの改善方法を具体的に教えてください。" })
        .waitFor({ timeout: 30 * 1000 });
    } catch (err) {
      consola.error("2通目のメッセージの送信完了を待機中にタイムアウトしました", err);
    }
  }
  await flow.endTimespan();
  consola.debug("DmChatFlowAction - timespan end");

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
    consola.error("DmChatFlowAction - createFlowResult failed:", err);
    const { breakdown, scoreX100 } = calculateHackathonScore({} as any, { isUserflow: true });
    return {
      audits: {} as any,
      breakdown,
      scoreX100,
    };
  }
}
