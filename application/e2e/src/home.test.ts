import { expect, test } from "@playwright/test";

import { dynamicMediaMask, scrollEntire, waitForVisibleMedia } from "./utils";

test.describe("ホーム", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
  });

  test("タイムラインが表示される", async ({ page }) => {
    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible({ timeout: 30_000 });
    const count = await articles.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // VRT: タイムライン（サインイン前）
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("home-タイムライン（サインイン前）.png", {
      fullPage: false,
      mask: dynamicMediaMask(page),
    });
  });

  test("タイトルが「タイムライン - CaX」", async ({ page }) => {
    await expect(page).toHaveTitle("タイムライン - CaX", { timeout: 30_000 });
  });

  test("動画が自動再生される", async ({ page }) => {
    const videoPlayer = page.locator('article button[aria-label="動画プレイヤー"]').first();

    await waitForVisibleMedia(page);

    await expect(videoPlayer).toBeVisible({ timeout: 30_000 });
  });

  test("音声の波形が表示される", async ({ page }) => {
    const waveform = page.locator('svg[viewBox="0 0 100 1"]').first();
    await expect(waveform).toBeVisible({ timeout: 30_000 });
  });

  test("写真が枠を覆う形で拡縮している", async ({ page }) => {
    const coveredImage = page.locator("article .grid img").first();
    await expect(coveredImage).toBeVisible({ timeout: 30_000 });

    const position = await coveredImage.evaluate((el) => {
      return window.getComputedStyle(el).position;
    });
    expect(position).toBe("absolute");
  });

  test("投稿クリック → 投稿詳細に遷移する", async ({ page }) => {
    const firstArticle = page.locator("article").first();
    await expect(firstArticle).toBeVisible({ timeout: 30_000 });
    await firstArticle.click();
    await page.waitForURL("**/posts/*", { timeout: 30_000 });
    expect(page.url()).toMatch(/\/posts\/[a-zA-Z0-9-]+/);
  });
});

test.describe("404ページ", () => {
  test("存在しないページで404が表示される", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/this-page-does-not-exist");
    await scrollEntire(page);

    // VRT: 404
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("home-404.png", {
      fullPage: true,
      mask: dynamicMediaMask(page),
    });
  });
});
