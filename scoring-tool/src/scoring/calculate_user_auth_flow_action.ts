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
    // ユーザーフロー全体を 0 扱いにしないため、ここは落とさずログ出力に留める
    consola.error("UserAuthFlowAction - goTo failed:", err);
  }
  consola.debug("UserAuthFlowAction - navigate end");

  const flow = await startFlow(puppeteerPage);

  // DB に既に同名ユーザーが存在すると signup が失敗しやすいため、
  // 毎回ユニークなユーザー名/名前を生成してから signup -> signin する
  const uniqueSuffix = Math.floor(Date.now() / 1000)
    .toString(10)
    .slice(-6);
  const username = `wsh_${uniqueSuffix}`;
  const name = `wsh_${uniqueSuffix}`;
  const password = "superultra_hyper_miracle_romantic";
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
      consola.error("UserAuthFlowAction - sign-in modal show failed:", err);
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
      consola.error("UserAuthFlowAction - signup modal transition failed:", err);
    }
    try {
      const input = playwrightPage.getByRole("dialog").getByLabel("ユーザー名");
      await input.waitFor({ state: "visible", timeout: 10 * 1000 });
      await input.click();
      await input.fill(username);
    } catch (err) {
      consola.error("UserAuthFlowAction - username input failed:", err);
    }
    try {
      const input = playwrightPage.getByRole("dialog").getByLabel("名前");
      await input.waitFor({ state: "visible", timeout: 10 * 1000 });
      await input.click();
      await input.fill(name);
    } catch (err) {
      consola.error("UserAuthFlowAction - name input failed:", err);
    }
    try {
      const input = playwrightPage.getByRole("dialog").getByLabel("パスワード");
      await input.waitFor({ state: "visible", timeout: 10 * 1000 });
      await input.click();
      await input.fill(password);
    } catch (err) {
      consola.error("UserAuthFlowAction - password input failed:", err);
    }
    try {
      const button = playwrightPage.getByRole("dialog").getByRole("button", { name: "登録する" });
      await button.click();
      await playwrightPage
        .getByRole("link", { name: "マイページ" })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      consola.error("UserAuthFlowAction - signup submit failed:", err);
    }
  }

  // サインアウト
  {
    try {
      const button = playwrightPage.getByRole("button", { name: "アカウントメニュー" });
      await button.click();
    } catch (err) {
      consola.error("UserAuthFlowAction - account menu show failed:", err);
    }
    try {
      const button = playwrightPage.getByRole("button", { name: "サインアウト" });
      await button.click();
      await playwrightPage
        .getByRole("button", { name: "サインイン" })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      consola.error("UserAuthFlowAction - sign-out failed:", err);
    }
  }

  // サインイン
  {
    try {
      const button = playwrightPage.getByRole("button", { name: "サインイン" });
      await button.click();
      await playwrightPage
        .getByRole("dialog")
        .getByRole("heading", { name: "サインイン" })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      consola.error("UserAuthFlowAction - sign-in modal show failed:", err);
    }
    try {
      const input = playwrightPage.getByRole("dialog").getByLabel("ユーザー名");
      await input.waitFor({ state: "visible", timeout: 10 * 1000 });
      await input.click();
      await input.fill(username);
    } catch (err) {
      consola.error("UserAuthFlowAction - username input failed:", err);
    }
    try {
      const input = playwrightPage.getByRole("dialog").getByLabel("パスワード");
      await input.waitFor({ state: "visible", timeout: 10 * 1000 });
      await input.click();
      await input.fill(password);
    } catch (err) {
      consola.error("UserAuthFlowAction - password input failed:", err);
    }
    // Lighthouse timespan は最後のサインイン押下〜遷移だけに絞る（計測の安定性優先）
    let didStartTimespan = false;
    try {
      const button = playwrightPage.getByRole("dialog").getByRole("button", { name: "サインイン" });
      await button.waitFor({ state: "visible", timeout: 10 * 1000 });

      consola.debug("UserAuthFlowAction - timespan start (sign-in)");
      await flow.startTimespan();
      didStartTimespan = true;
      await button.click();
      await playwrightPage
        .getByRole("link", { name: "マイページ" })
        .waitFor({ timeout: 10 * 1000 });
    } catch (err) {
      consola.error("UserAuthFlowAction - sign-in wait failed:", err);
    } finally {
      if (didStartTimespan) {
        try {
          await flow.endTimespan();
        } catch (err) {
          consola.error("UserAuthFlowAction - endTimespan failed:", err);
        }
      }
    }
  }

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
    // Lighthouse が「step無し」で例外を投げることがあるため、
    // 例外は握りつぶして 0 点として返す（計測不能扱いを回避）
    consola.error("UserAuthFlowAction - createFlowResult failed:", err);
    const { breakdown, scoreX100 } = calculateHackathonScore({} as any, { isUserflow: true });
    return {
      audits: {} as any,
      breakdown,
      scoreX100,
    };
  }
}
