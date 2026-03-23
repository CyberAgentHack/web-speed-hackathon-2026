import { setTimeout as sleep } from "node:timers/promises";

import { startFlow as startFlowOrig } from "lighthouse";

import { createPage } from "./src/utils/create_page";
import { goTo } from "./src/utils/go_to";

const DEVICE = {
  deviceScaleFactor: 1,
  hasTouch: false,
  isMobile: false,
  viewport: {
    height: 1080,
    width: 1920,
  },
};

const TARGETS = {
  home: "/",
  "post-video": "/posts/fff790f5-99ea-432f-8f79-21d3d49efd1a",
  "post-audio": "/posts/fefe75bd-1b7a-478c-8ecc-2c1ab38b821e",
  "dm-detail": "/dm/33881deb-da8a-4ca9-a153-2f80d5fa7af8",
  terms: "/terms",
} as const;

type TargetName = keyof typeof TARGETS;

function printAudit(audits: Record<string, LH.Audit.Result>, id: string) {
  const audit = audits[id];
  if (audit == null) {
    console.log(`\n[${id}] missing`);
    return;
  }

  console.log(`\n[${id}]`);
  console.log(`title: ${audit.title}`);
  console.log(`score: ${audit.score}`);

  if ("numericValue" in audit && typeof audit.numericValue === "number") {
    console.log(`numericValue: ${audit.numericValue}`);
  }
  if ("displayValue" in audit && typeof audit.displayValue === "string") {
    console.log(`displayValue: ${audit.displayValue}`);
  }
  if ("description" in audit && typeof audit.description === "string") {
    console.log(`description: ${audit.description}`);
  }

  const details = audit.details;
  if (details?.type === "table" && Array.isArray(details.items)) {
    console.log("items:");
    for (const item of details.items.slice(0, 10)) {
      console.log(JSON.stringify(item));
    }
  } else if (details?.type === "list" && Array.isArray(details.items)) {
    console.log("items:");
    for (const item of details.items.slice(0, 10)) {
      console.log(JSON.stringify(item));
    }
  } else if (details?.type === "criticalrequestchain") {
    console.log("critical request chain present");
  }
}

async function run(target: TargetName, baseUrl: string) {
  const path = TARGETS[target];
  const url = new URL(path, baseUrl).href;

  await using context = await createPage({ device: DEVICE });
  const { playwrightPage, puppeteerPage } = context;

  if (target === "dm-detail") {
    await goTo({
      playwrightPage,
      puppeteerPage,
      timeout: 120 * 1000,
      url: new URL("/not-found", baseUrl).href,
    });
    await playwrightPage.getByRole("button", { name: "サインイン" }).click();
    await playwrightPage.getByRole("dialog").getByRole("heading", { name: "サインイン" }).waitFor({
      timeout: 10 * 1000,
    });
    await playwrightPage
      .getByRole("dialog")
      .getByRole("textbox", { name: "ユーザー名" })
      .pressSequentially("o6yq16leo");
    await playwrightPage
      .getByRole("dialog")
      .getByRole("textbox", { name: "パスワード" })
      .pressSequentially("wsh-2026");
    await playwrightPage.getByRole("dialog").getByRole("button", { name: "サインイン" }).click();
    await playwrightPage.getByRole("link", { name: "マイページ" }).waitFor({ timeout: 10 * 1000 });
  }

  const flow = await startFlowOrig(puppeteerPage, {
    config: {
      extends: "lighthouse:default",
      settings: {
        disableFullPageScreenshot: true,
        disableStorageReset: true,
        formFactor: "desktop",
        maxWaitForFcp: 120 * 1000,
        maxWaitForLoad: 180 * 1000,
        onlyAudits: [
          "first-contentful-paint",
          "speed-index",
          "largest-contentful-paint",
          "largest-contentful-paint-element",
          "lcp-breakdown",
          "total-blocking-time",
          "long-tasks",
          "mainthread-work-breakdown",
          "bootup-time",
          "render-blocking-resources",
          "network-requests",
          "diagnostics",
        ],
        screenEmulation: {
          disabled: true,
        },
        throttlingMethod: "simulate",
      },
    },
  });

  await flow.startNavigation();
  await goTo({
    playwrightPage,
    puppeteerPage,
    timeout: 120 * 1000,
    url,
  });
  await flow.endNavigation();

  const {
    steps: [result],
  } = await flow.createFlowResult();

  const audits = result!.lhr.audits;

  console.log(`\n===== ${target} =====`);
  printAudit(audits, "first-contentful-paint");
  printAudit(audits, "largest-contentful-paint");
  printAudit(audits, "largest-contentful-paint-element");
  printAudit(audits, "lcp-breakdown");
  printAudit(audits, "total-blocking-time");
  printAudit(audits, "long-tasks");
  printAudit(audits, "mainthread-work-breakdown");
  printAudit(audits, "bootup-time");
  printAudit(audits, "render-blocking-resources");
  printAudit(audits, "network-requests");
  printAudit(audits, "diagnostics");

  await sleep(1_000);
}

async function main() {
  const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
  const target = (process.argv[3] ?? "home") as TargetName;

  if (!(target in TARGETS)) {
    throw new Error(`unknown target: ${target}`);
  }

  await run(target, baseUrl);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
