import { expect, test } from "@playwright/test";

import { dynamicMediaMask, waitForPageToLoad, waitForVisibleMedia } from "./utils";

test.describe("投稿詳細", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("投稿が表示される", async ({ page }) => {
    await page.goto("/");
    const firstArticle = page.locator("article").first();
    await expect(firstArticle).toBeVisible({ timeout: 30_000 });
    await firstArticle.click();
    await page.waitForURL("**/posts/*", { timeout: 30_000 });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 30_000 });

    // VRT: 投稿詳細
    await waitForVisibleMedia(page);
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("post-detail-投稿詳細.png", {
      mask: dynamicMediaMask(page),
    });
  });

  test("タイトルが「{ユーザー名} さんのつぶやき - CaX」", async ({ page }) => {
    await page.goto("/");
    const firstArticle = page.locator("article").first();
    await expect(firstArticle).toBeVisible({ timeout: 30_000 });
    await firstArticle.click();
    await page.waitForURL("**/posts/*", { timeout: 30_000 });

    await expect(page).toHaveTitle(/さんのつぶやき - CaX/, { timeout: 30_000 });
  });
});

test.describe("投稿詳細 - 動画", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("動画が自動再生され、クリックで一時停止・再生を切り替えられる", async ({ page }) => {
    await page.goto("/");
    const movieArticle = page.locator('article:has(button[aria-label="動画プレイヤー"])').first();
    await expect(movieArticle).toBeVisible({ timeout: 30_000 });
    await movieArticle.locator("time").first().click();
    await page.waitForURL("**/posts/*", { timeout: 30_000 });

    const videoPlayer = page.locator('button[aria-label="動画プレイヤー"]').first();
    await expect(videoPlayer).toBeVisible({ timeout: 30_000 });

    // VRT: 動画再生中
    await waitForVisibleMedia(page);
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("post-detail-動画再生中.png", {
      mask: dynamicMediaMask(page),
    });

    // クリックで一時停止
    await videoPlayer.click();

    // 再度クリックして再生再開
    await videoPlayer.click();
  });
});

test.describe("投稿詳細 - 音声", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("音声の波形が表示され、再生ボタンで切り替えられる", async ({ page }) => {
    await page.goto("/");
    const soundArticle = page.locator('article:has(svg[viewBox="0 0 100 1"])').first();
    await expect(soundArticle).toBeVisible({ timeout: 30_000 });
    await soundArticle.locator("time").first().click();
    await page.waitForURL("**/posts/*", { timeout: 30_000 });

    const waveform = page.locator('svg[viewBox="0 0 100 1"]').first();
    await expect(waveform).toBeVisible({ timeout: 30_000 });

    // VRT: 音声（再生前）
    await waitForVisibleMedia(page);
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("post-detail-音声再生前.png", {
      mask: dynamicMediaMask(page),
    });

    // 再生ボタンをクリック
    const playButton = page.locator("button.rounded-full.bg-cax-accent").first();
    await playButton.click();

    // 少し待ってから一時停止
    await page.waitForTimeout(1_000);
    await playButton.click();
  });
});

test.describe("投稿詳細 - 写真", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("写真がcover拡縮し、画像サイズが著しく荒くない", async ({ page }) => {
    await page.goto("/");
    const imageArticle = page.locator("article:has(.grid img)").first();
    await expect(imageArticle).toBeVisible({ timeout: 30_000 });
    await imageArticle.click();
    await page.waitForURL("**/posts/*", { timeout: 30_000 });

    const coveredImage = page.locator(".grid img").first();
    await expect(coveredImage).toBeVisible({ timeout: 30_000 });

    const position = await coveredImage.evaluate((el) => {
      return window.getComputedStyle(el).position;
    });
    expect(position).toBe("absolute");

    const naturalWidth = await coveredImage.evaluate((el: HTMLImageElement) => el.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(100);

    // VRT: 写真投稿詳細
    await waitForVisibleMedia(page);
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("post-detail-写真.png", {
      mask: dynamicMediaMask(page),
    });
  });
});
