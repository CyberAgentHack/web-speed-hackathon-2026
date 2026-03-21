import { expect, test } from "@playwright/test";

import { dynamicMediaMask, waitForPageToLoad, waitForVisibleMedia } from "./utils";

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

    // VRT: ユーザー詳細（無限スクロールがあるため viewport のみ）
    await waitForVisibleMedia(page);
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("user-profile-ユーザー詳細.png", {
      fullPage: false,
      mask: dynamicMediaMask(page),
    });
  });
});
