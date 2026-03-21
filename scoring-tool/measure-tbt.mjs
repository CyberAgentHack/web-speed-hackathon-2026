import puppeteer from "puppeteer";
import { startFlow } from "lighthouse";

const BASE = "https://pr-60-web-speed-hackathon-2026.fly.dev";

const LH_CONFIG = {
  extends: "lighthouse:default",
  settings: {
    disableFullPageScreenshot: true,
    disableStorageReset: true,
    formFactor: "desktop",
    maxWaitForFcp: 120000,
    maxWaitForLoad: 180000,
    onlyAudits: [
      "total-blocking-time",
      "first-contentful-paint",
      "mainthread-work-breakdown",
      "diagnostics",
      "network-requests",
    ],
    screenEmulation: { disabled: true },
    throttlingMethod: "simulate",
  },
};

async function measure(name, url) {
  const browser = await puppeteer.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const flow = await startFlow(page, { config: LH_CONFIG });
  await flow.startNavigation();
  await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
  await flow.endNavigation();

  const result = await flow.createFlowResult();
  const audits = result.steps[0].lhr.audits;

  const tbt = audits["total-blocking-time"];
  const fcp = audits["first-contentful-paint"];

  console.log(`\n=== ${name} ===`);
  console.log(`TBT: ${tbt.numericValue.toFixed(0)}ms (score: ${tbt.score})`);
  console.log(`FCP: ${fcp.numericValue.toFixed(0)}ms (score: ${fcp.score})`);

  // Main thread breakdown
  const mtb = audits["mainthread-work-breakdown"];
  if (mtb && mtb.details && mtb.details.items) {
    console.log("\nMain thread breakdown:");
    for (const item of mtb.details.items.slice(0, 10)) {
      console.log(`  ${item.groupLabel.padEnd(35)} ${item.duration.toFixed(1)}ms`);
    }
  }

  // Network requests summary
  const nr = audits["network-requests"];
  if (nr && nr.details && nr.details.items) {
    const items = nr.details.items;
    console.log(`\nNetwork requests: ${items.length} total`);
    // Show slow/large requests
    const sorted = [...items].sort((a, b) => b.transferSize - a.transferSize);
    console.log("Top by size:");
    for (const item of sorted.slice(0, 8)) {
      const url = item.url.replace(BASE, "").substring(0, 80);
      console.log(`  ${String(Math.round(item.transferSize / 1024)).padStart(5)}k  ${url}`);
    }
  }

  // Diagnostics
  const diag = audits["diagnostics"];
  if (diag && diag.details && diag.details.items) {
    const d = diag.details.items[0];
    console.log(`\nDiagnostics: numRequests=${d.numRequests} numScripts=${d.numScripts} numFonts=${d.numFonts} totalByteWeight=${Math.round(d.totalByteWeight/1024)}k mainDocTransferSize=${Math.round(d.mainDocumentTransferSize/1024)}k maxServerLatency=${d.maxServerLatency?.toFixed(0)}ms`);
  }

  await browser.close();
}

(async () => {
  await measure("Home", BASE + "/");
  await measure("Terms", BASE + "/terms");
  await measure("Search", BASE + "/search");
  await measure("Post", BASE + "/posts/ff93a168-ea7c-4202-9879-672382febfda");
})().catch(e => console.error(e));
