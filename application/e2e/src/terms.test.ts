import { expect, test } from "@playwright/test";

import { dynamicMediaMask, scrollEntire, waitForVisibleMedia } from "./utils";

test.describe("利用規約", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/terms");
  });

  test("タイトルが「利用規約 - CaX」", async ({ page }) => {
    await expect(page).toHaveTitle("利用規約 - CaX", { timeout: 30_000 });
  });

  test("ページが正しく表示されている", async ({ page }) => {
    // VRT: 利用規約
    await scrollEntire(page);
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("terms-利用規約.png", {
      fullPage: true,
      mask: dynamicMediaMask(page),
    });
  });
});
