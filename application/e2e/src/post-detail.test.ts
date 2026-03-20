import { expect, test } from "@playwright/test";

import { dynamicMediaMask, waitForVisibleMedia } from "./utils";

const DEFAULT_POST_ID = "fff790f5-99ea-432f-8f79-21d3d49efd1a";
const MOVIE_POST_ID = "fff790f5-99ea-432f-8f79-21d3d49efd1a";
const SOUND_POST_ID = "ffe1378a-69b1-4397-bced-82c6a455a363";
const IMAGE_POST_ID = "ffec432e-af82-44ec-9916-bdbd95492013";

test.describe("投稿詳細", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("投稿が表示される", async ({ page }) => {
    await page.goto(`/posts/${DEFAULT_POST_ID}`);

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 30_000 });

    // VRT: 投稿詳細
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("post-detail-投稿詳細.png", {
      mask: dynamicMediaMask(page),
    });
  });

  test("タイトルが「{ユーザー名} さんのつぶやき - CaX」", async ({ page }) => {
    await page.goto(`/posts/${DEFAULT_POST_ID}`);

    await expect(page).toHaveTitle(/さんのつぶやき - CaX/, { timeout: 30_000 });
  });
});

test.describe("投稿詳細 - 動画", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("動画が自動再生され、クリックで一時停止・再生を切り替えられる", async ({ page }) => {
    await page.goto(`/posts/${MOVIE_POST_ID}`);

    const movieArea = page.locator("[data-movie-area]").first();
    const videoPlayer = page.getByRole("button", { name: "動画プレイヤー" }).first();
    await expect(movieArea.locator("canvas")).toBeVisible({ timeout: 30_000 });
    await expect(videoPlayer).toBeVisible({ timeout: 30_000 });

    // VRT: 動画再生中
    await waitForVisibleMedia(page);
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
    await page.goto(`/posts/${SOUND_POST_ID}`);

    const waveform = page.locator('svg[viewBox="0 0 100 1"]').first();
    await expect(waveform).toBeVisible({ timeout: 30_000 });

    // VRT: 音声（再生前）
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("post-detail-音声再生前.png", {
      mask: dynamicMediaMask(page),
    });

    // 再生ボタンをクリック
    const playButton = page.getByRole("button", { name: "音声を再生" }).first();
    await playButton.click();

    // 少し待ってから一時停止
    await page.waitForTimeout(1_000);
    await page.getByRole("button", { name: "音声を一時停止" }).first().click();
  });
});

test.describe("投稿詳細 - 写真", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("写真がcover拡縮し、画像サイズが著しく荒くない", async ({ page }) => {
    await page.goto(`/posts/${IMAGE_POST_ID}`);

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
    await expect(page).toHaveScreenshot("post-detail-写真.png", {
      mask: dynamicMediaMask(page),
    });
  });
});
