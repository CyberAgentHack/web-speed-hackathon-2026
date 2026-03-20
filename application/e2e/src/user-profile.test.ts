import { expect, test } from "@playwright/test";

import { dynamicMediaMask, waitForVisibleMedia } from "./utils";

test.describe("ユーザー詳細", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("タイトルが「{ユーザー名} さんのタイムライン - CaX」", async ({ page }) => {
    await page.goto("/users/o6yq16leo");
    await expect(page).toHaveTitle(/さんのタイムライン - CaX/, {
      timeout: 30_000,
    });
  });

  test("ページ上部がユーザーサムネイル画像の色を抽出した色になっている", async ({ page }) => {
    await page.goto("/users/o6yq16leo");

    const headerDiv = page.locator("header > div").first();
    await expect(headerDiv).toBeVisible({ timeout: 30_000 });

    await expect(async () => {
      const bgColor = await headerDiv.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(bgColor).toMatch(/^rgb/);
    }).toPass({ timeout: 30_000 });

    // VRT: ユーザー詳細（無限スクロールがあるため viewport のみ）
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("user-profile-ユーザー詳細.png", {
      fullPage: false,
      mask: dynamicMediaMask(page),
    });
  });

});
