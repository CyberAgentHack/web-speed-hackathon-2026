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

export async function calculateDmPage({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  consola.debug("DMPage - navigate");
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
  consola.debug("DMPage - navigate end");

  // サインイン
  consola.debug("DMPage - signin");
  try {
    await signInWithDefaultUser({ page: playwrightPage });
  } catch (err) {
    throw new Error("サインインに失敗しました", { cause: err });
  }
  consola.debug("DMPage - signin end");

  const flow = await startFlow(puppeteerPage);

  consola.debug("DMPage - navigate");
  await flow.startNavigation();
  try {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL("/dm/33881deb-da8a-4ca9-a153-2f80d5fa7af8", baseUrl).href,
    });
  } catch (err) {
    throw new Error("ページの読み込みに失敗したか、タイムアウトしました", { cause: err });
  }
  await flow.endNavigation();

  consola.debug("DMPage - navigate end");
  const {
    steps: [result],
  } = await flow.createFlowResult();

  const { breakdown, scoreX100 } = calculateHackathonScore(result!.lhr.audits, {
    isUserflow: false,
  });

  return {
    audits: result!.lhr.audits,
    breakdown,
    scoreX100,
  };
}
