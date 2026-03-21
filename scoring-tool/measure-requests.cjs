const puppeteer = require("puppeteer");
const BASE = "https://pr-60-web-speed-hackathon-2026.fly.dev";

async function getRequests(name, url) {
  const browser = await puppeteer.launch({ headless: true, channel: "chrome", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  const requests = [];
  page.on("request", req => {
    requests.push({ url: req.url(), type: req.resourceType(), ts: Date.now() });
  });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise(r => setTimeout(r, 5000));
  console.log("=== " + name + " (" + requests.length + " requests) ===");
  for (const r of requests) {
    const short = r.url.replace(BASE, "");
    const isJsAsset = short.startsWith("/assets/") && short.endsWith(".js");
    const isCssAsset = short.startsWith("/assets/") && short.endsWith(".css");
    if (isJsAsset || isCssAsset) continue;
    const elapsed = r.ts - t0;
    console.log("  +" + String(elapsed).padStart(5) + "ms  " + r.type.padEnd(12) + short.substring(0, 120));
  }
  console.log();
  await browser.close();
}

(async () => {
  await getRequests("Home", BASE + "/");
  await getRequests("Terms", BASE + "/terms");
  await getRequests("Search", BASE + "/search");
  await getRequests("Post", BASE + "/posts/ff93a168-ea7c-4202-9879-672382febfda");
})().catch(e => console.error(e));
