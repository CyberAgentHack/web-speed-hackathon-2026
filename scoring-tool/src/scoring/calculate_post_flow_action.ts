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

async function waitForPostDetail(playwrightPage: playwright.Page, text: string) {
  await playwrightPage.waitForURL("**/posts/*", { timeout: 120 * 1000 });
  const article = playwrightPage.getByRole("article").first();
  await article.waitFor({ timeout: 120 * 1000 });
  await article.getByText(text).waitFor({ timeout: 120 * 1000 });
  return article;
}

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
      await contentInput.pressSequentially(
        "あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。",
      );
    } catch (err) {
      throw new Error("投稿内容の入力に失敗しました", { cause: err });
    }
    try {
      const submitButton = playwrightPage
        .getByRole("dialog", { name: "新規投稿" })
        .getByRole("button", { name: "投稿する" });
      await submitButton.click();
      await waitForPostDetail(
        playwrightPage,
        "あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。",
      );
    } catch (err) {
      throw new Error("投稿の完了を確認できませんでした", { cause: err });
    }
  }
  // 画像の投稿
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
      await contentInput.pressSequentially("画像を添付したテスト投稿です。");
    } catch (err) {
      throw new Error("投稿内容の入力に失敗しました", { cause: err });
    }
    try {
      const imageInput = playwrightPage
        .getByRole("dialog", { name: "新規投稿" })
        .getByLabel("画像を添付");
      await imageInput.setInputFiles(IMAGE_FILE);
    } catch (err) {
      throw new Error("投稿のファイル添付に失敗しました", { cause: err });
    }
    try {
      const submitButton = playwrightPage
        .getByRole("dialog", { name: "新規投稿" })
        .getByRole("button", { name: "投稿する" });
      await submitButton.waitFor({ timeout: 120 * 1000 });
      await submitButton.click();
      const article = await waitForPostDetail(playwrightPage, "画像を添付したテスト投稿です。");
      await article.getByRole("button", { name: "ALT を表示する" }).waitFor({
        timeout: 120 * 1000,
      });
    } catch (err) {
      throw new Error("画像投稿の完了を確認できませんでした", { cause: err });
    }
  }
  // 動画の投稿
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
      await contentInput.pressSequentially("動画を添付したテスト投稿です。");
    } catch (err) {
      throw new Error("投稿内容の入力に失敗しました", { cause: err });
    }
    try {
      const videoInput = playwrightPage
        .getByRole("dialog", { name: "新規投稿" })
        .getByLabel("動画を添付");
      await videoInput.setInputFiles(VIDEO_FILE);
    } catch (err) {
      throw new Error("動画ファイルの添付に失敗しました", { cause: err });
    }
    try {
      const submitButton = playwrightPage
        .getByRole("dialog", { name: "新規投稿" })
        .getByRole("button", { name: "投稿する" });
      await submitButton.waitFor({ timeout: 120 * 1000 });
      await submitButton.click({ timeout: 120 * 1000 });
      const article = await waitForPostDetail(playwrightPage, "動画を添付したテスト投稿です。");
      await article.locator("[data-movie-area]").waitFor({ timeout: 120 * 1000 });
    } catch (err) {
      throw new Error("動画投稿の完了を確認できませんでした", { cause: err });
    }
  }
  // 音声の投稿
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
      await contentInput.pressSequentially("音声を添付したテスト投稿です。");
    } catch (err) {
      throw new Error("投稿内容の入力に失敗しました", { cause: err });
    }
    try {
      const audioInput = playwrightPage
        .getByRole("dialog", { name: "新規投稿" })
        .getByLabel("音声を添付");
      await audioInput.setInputFiles(AUDIO_FILE);
    } catch (err) {
      throw new Error("音声ファイルの添付に失敗しました", { cause: err });
    }
    try {
      const submitButton = playwrightPage
        .getByRole("dialog", { name: "新規投稿" })
        .getByRole("button", { name: "投稿する" });
      await submitButton.waitFor({ timeout: 120 * 1000 });
      await submitButton.click();
      const article = await waitForPostDetail(playwrightPage, "音声を添付したテスト投稿です。");
      await article.locator("[data-sound-area]").waitFor({ timeout: 120 * 1000 });
    } catch (err) {
      throw new Error("音声投稿の完了を確認できませんでした", { cause: err });
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
