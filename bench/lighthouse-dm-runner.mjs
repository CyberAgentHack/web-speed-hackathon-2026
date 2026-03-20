#!/usr/bin/env node
/**
 * lighthouse-dm-runner.mjs — API でサインイン後、Cookie を設定して Lighthouse user-flow で DM ページを計測
 *
 * Usage: node bench/lighthouse-dm-runner.mjs <BASE_URL> <DM_PATH> <OUTPUT_JSON> <CHROME_PATH>
 *
 * 依存: scoring-tool の node_modules (puppeteer-core, lighthouse)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scoringToolDir = path.resolve(__dirname, "../scoring-tool");

// scoring-tool の package.json を基点に require.resolve する
const stRequire = createRequire(path.join(scoringToolDir, "package.json"));

// puppeteer は npm:puppeteer-core@24.23.0 にエイリアスされている
const puppeteerPath = stRequire.resolve("puppeteer");
const puppeteer = await import(puppeteerPath);

const [BASE_URL, DM_PATH, OUTPUT_JSON, CHROME_PATH] = process.argv.slice(2);

if (!BASE_URL || !DM_PATH || !OUTPUT_JSON || !CHROME_PATH) {
  console.error(
    "Usage: node lighthouse-dm-runner.mjs <BASE_URL> <DM_PATH> <OUTPUT_JSON> <CHROME_PATH>",
  );
  process.exit(1);
}

// 1. API でサインインしてセッションCookieを取得
const signinRes = await fetch(new URL("/api/v1/signin", BASE_URL).href, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "o6yq16leo", password: "wsh-2026" }),
  redirect: "manual",
});

let setCookieHeaders = signinRes.headers.getSetCookie?.() ?? [];
if (setCookieHeaders.length === 0) {
  const raw = signinRes.headers.get("set-cookie");
  if (raw) setCookieHeaders = [raw];
}

if (setCookieHeaders.length === 0) {
  console.error("Failed to sign in: no set-cookie header");
  process.exit(1);
}

// Cookie のパース
const parsedUrl = new URL(BASE_URL);
const cookies = setCookieHeaders.map((header) => {
  const parts = header.split(";").map((p) => p.trim());
  const [nameValue, ...attrs] = parts;
  const eqIdx = nameValue.indexOf("=");
  const name = nameValue.slice(0, eqIdx);
  const value = nameValue.slice(eqIdx + 1);
  return {
    name,
    value,
    domain: parsedUrl.hostname,
    path: "/",
    httpOnly: attrs.some((a) => a.toLowerCase() === "httponly"),
    secure: attrs.some((a) => a.toLowerCase() === "secure"),
  };
});

// 2. ブラウザ起動 & Cookie 設定
const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1350, height: 940 });
  await page.setCookie(...cookies);

  // ホームに一度遷移して認証状態を安定させる
  await page.goto(new URL("/", BASE_URL).href, {
    waitUntil: "networkidle0",
    timeout: 60_000,
  });

  // 3. Lighthouse user-flow で DM ページを計測
  const lighthousePath = stRequire.resolve("lighthouse");
  const { startFlow } = await import(lighthousePath);
  const flow = await startFlow(page, {
    config: {
      extends: "lighthouse:default",
      settings: {
        disableFullPageScreenshot: true,
        disableStorageReset: true,
        formFactor: "desktop",
        maxWaitForFcp: 120_000,
        maxWaitForLoad: 180_000,
        onlyAudits: [
          "first-contentful-paint",
          "speed-index",
          "largest-contentful-paint",
          "total-blocking-time",
          "cumulative-layout-shift",
        ],
        screenEmulation: { disabled: true },
        throttlingMethod: "simulate",
      },
    },
  });

  await flow.startNavigation();
  await page.goto(new URL(DM_PATH, BASE_URL).href, {
    waitUntil: "networkidle0",
    timeout: 120_000,
  });
  await flow.endNavigation();

  // 4. 結果を保存
  const {
    steps: [result],
  } = await flow.createFlowResult();
  const lhr = result.lhr;

  const output = {
    audits: lhr.audits,
    categories: lhr.categories,
  };
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));
} finally {
  await browser.close();
}
