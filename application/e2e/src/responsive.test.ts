import { expect, test } from "@playwright/test";

import { dynamicMediaMask, waitForPageToLoad, waitForVisibleMedia } from "./utils";

test.describe("レスポンシブ", () => {
  test("スマホ表示で表示が崩れない", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible({ timeout: 30_000 });

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    const nav = page.locator("nav");
    await expect(nav.first()).toBeVisible();

    // VRT: スマホ表示
    await waitForVisibleMedia(page);
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("responsive-スマホ.png", {
      fullPage: false,
      mask: dynamicMediaMask(page),
    });
  });

  test("デスクトップ表示で表示が崩れない", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible({ timeout: 30_000 });

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    const nav = page.locator("nav");
    await expect(nav.first()).toBeVisible();

    const navBox = await nav.first().boundingBox();
    expect(navBox).toBeTruthy();
    expect(navBox!.x).toBeLessThan(960);

    // VRT: デスクトップ表示
    await waitForVisibleMedia(page);
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("responsive-デスクトップ.png", {
      fullPage: false,
      mask: dynamicMediaMask(page),
    });
  });
});
