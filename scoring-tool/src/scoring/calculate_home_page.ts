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

export async function calculateHomePage({ baseUrl, playwrightPage, puppeteerPage }: Params) {
  const flow = await startFlow(puppeteerPage);

  consola.debug("Home - navigate");
  await flow.startNavigation();
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
  await flow.endNavigation();

  consola.debug("Home - navigate end");
  const {
    steps: [result],
  } = await flow.createFlowResult();

  const audits = result!.lhr.audits;

  // LCP情報
  const lcpAudit = audits["largest-contentful-paint"];
  console.log("Home LCP:", lcpAudit?.numericValue, "ms, score:", lcpAudit?.score);

  // ネットワークリクエスト一覧（サイズ順）
  const networkAudit = audits["network-requests"];
  if (networkAudit?.details?.items) {
    const items = (networkAudit.details.items as any[])
      .filter((r: any) => r.transferSize > 0)
      .sort((a: any, b: any) => b.transferSize - a.transferSize);
    console.log("\n=== Network Requests (by size) ===");
    for (const r of items) {
      console.log(`${Math.round(r.transferSize / 1024)}KB | ${Math.round(r.endTime - r.startTime)}ms | ${r.url}`);
    }
    console.log(`Total: ${Math.round(items.reduce((s: number, r: any) => s + r.transferSize, 0) / 1024)}KB`);
  }

  const { breakdown, scoreX100 } = calculateHackathonScore(audits, {
    isUserflow: false,
  });

  return {
    audits: result!.lhr.audits,
    breakdown,
    scoreX100,
  };
}
