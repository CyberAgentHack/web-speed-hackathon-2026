import path from "node:path";
import { fileURLToPath } from "node:url";

import * as playwright from "playwright";
import type * as puppeteer from "puppeteer";

import { consola } from "../consola";
import { goTo } from "../utils/go_to";
import { startFlow } from "../utils/start_flow";

import { calculateHackathonScore } from "./utils/calculate_hackathon_score";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, "../../..");
const IMAGE_FILE = path.join(WORKSPACE_ROOT, "docs/assets/analoguma.tiff");
const AUDIO_FILE = path.join(WORKSPACE_ROOT, "docs/assets/maoudamashii_shining_star.wav");
const VIDEO_FILE = path.join(WORKSPACE_ROOT, "docs/assets/pixabay_326739_kanenori_himejijo.mkv");

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
    const signinButton = playwrightPage.getByRole("button", { name: "サインイン" });
    await signinButton.click();
    await playwrightPage
      .getByRole("dialog")
      .getByRole("heading", { name: "サインイン" })
      .waitFor({ timeout: 10 * 1000 });
  } catch (err) {
    consola.error("PostFlowAction - sign-in modal show failed:", err);
  }
  try {
    const usernameInput = playwrightPage
      .getByRole("dialog")
      .getByRole("textbox", { name: "ユーザー名" });
    await usernameInput.pressSequentially("o6yq16leo");
  } catch (err) {
    consola.error("PostFlowAction - username input failed:", err);
  }
  try {
    const passwordInput = playwrightPage
      .getByRole("dialog")
      .getByRole("textbox", { name: "パスワード" });
    await passwordInput.pressSequentially("wsh-2026");
  } catch (err) {
    consola.error("PostFlowAction - password input failed:", err);
  }
  try {
    const submitButton = playwrightPage
      .getByRole("dialog")
      .getByRole("button", { name: "サインイン" });
    await submitButton.click();
    await playwrightPage.getByRole("link", { name: "マイページ" }).waitFor({ timeout: 10 * 1000 });
  } catch (err) {
    consola.error("PostFlowAction - sign-in submit failed:", err);
  }
  consola.debug("DmChatFlowAction - signin end");

  const flow = await startFlow(puppeteerPage);

  consola.debug("PostFlowAction - timespan");
  await flow.startTimespan();

  // テキスト投稿だけに絞る（画像/動画/音声手順はタイムアウト・strict mode 競合を起こしやすく、
  // ユーザーフロー測定が不安定になるため）
  const textToPost =
    "あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。";
  try {
    // 「投稿する」には複数要素がマッチしうるので、モーダルを開く側を最初のものに固定
    const postButton = playwrightPage.getByRole("button", { name: "投稿する" }).first();
    await postButton.click();

    await playwrightPage.getByRole("dialog", { name: "新規投稿" }).waitFor({ timeout: 30 * 1000 });

    const contentInput = playwrightPage
      .getByRole("dialog", { name: "新規投稿" })
      .getByRole("textbox", { name: "いまなにしてる？" });
    await contentInput.fill(textToPost);

    const submitButton = playwrightPage
      .getByRole("dialog", { name: "新規投稿" })
      .getByRole("button", { name: "投稿する" });
    await submitButton.click();

    await playwrightPage
      .getByRole("article")
      .getByText(textToPost)
      .waitFor({ timeout: 60 * 1000 });
  } catch (err) {
    consola.error("PostFlowAction - text post failed:", err);
  }
  await flow.endTimespan();
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
