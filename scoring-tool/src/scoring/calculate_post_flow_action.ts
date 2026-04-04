import type * as playwright from "playwright";
import type * as puppeteer from "puppeteer";

import { consola } from "../consola";
import { goTo } from "../utils/go_to";
import { signInWithDefaultUser } from "../utils/signin_with_default_user";
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
    consola.error("PostFlowAction - goTo failed:", err);
  }
  consola.debug("PostFlowAction - navigate end");

  // サインイン
  consola.debug("DmChatFlowAction - signin");
  try {
    await signInWithDefaultUser({ page: playwrightPage });
  } catch (err) {
    consola.error("PostFlowAction - sign-in submit failed:", err);
  }
  consola.debug("DmChatFlowAction - signin end");

  const flow = await startFlow(puppeteerPage).catch((err) => {
    consola.error("PostFlowAction - startFlow failed:", err);
    return null;
  });
  if (flow == null) {
    const { breakdown, scoreX100 } = calculateHackathonScore({} as any, { isUserflow: true });
    return {
      audits: {} as any,
      breakdown,
      scoreX100,
    };
  }

  consola.debug("PostFlowAction - timespan");
  let didStartTimespan = false;
  try {
    await flow.startTimespan();
    didStartTimespan = true;

    // テキスト投稿だけに絞る（画像/動画/音声手順はタイムアウト・strict mode 競合を起こしやすく、
    // ユーザーフロー測定が不安定になるため）
    const textToPost =
      "あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。";
    try {
      // 「投稿する」には複数要素がマッチしうるので、モーダルを開く側を最初のものに固定
      const postButton = playwrightPage.getByRole("button", { name: "投稿する" }).first();
      await postButton.click();

      await playwrightPage
        .getByRole("dialog", { name: "新規投稿" })
        .waitFor({ timeout: 30 * 1000 });

      const contentInput = playwrightPage
        .getByRole("dialog", { name: "新規投稿" })
        .getByRole("textbox", { name: "いまなにしてる？" });
      await contentInput.fill(textToPost);

      const submitButton = playwrightPage
        .getByRole("dialog", { name: "新規投稿" })
        .getByRole("button", { name: "投稿する" });
      await submitButton.click();

      // 成功時は投稿詳細へ遷移するため、タイムラインの article 待ちではタイムアウトしうる
      await playwrightPage.waitForURL("**/posts/*", { timeout: 60 * 1000 });
      await playwrightPage.getByText(textToPost).waitFor({ timeout: 30 * 1000 });
    } catch (err) {
      consola.error("PostFlowAction - text post failed:", err);
    }
  } finally {
    if (didStartTimespan) {
      try {
        await flow.endTimespan();
      } catch (err) {
        consola.error("PostFlowAction - endTimespan failed:", err);
      }
    }
  }
  consola.debug("PostFlowAction - timespan end");

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
    consola.error("PostFlowAction - createFlowResult failed:", err);
    const { breakdown, scoreX100 } = calculateHackathonScore({} as any, { isUserflow: true });
    return {
      audits: {} as any,
      breakdown,
      scoreX100,
    };
  }
}
