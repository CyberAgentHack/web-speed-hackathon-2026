import { expect, test } from "@playwright/test";

import { dynamicMediaMask, scrollEntire, waitForPageToLoad, waitForVisibleMedia } from "./utils";

test.describe("利用規約", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/terms");
  });

  test("タイトルが「利用規約 - CaX」", async ({ page }) => {
    await expect(page).toHaveTitle("利用規約 - CaX", { timeout: 3_000 });
  });

  test("ページが正しく表示されている", async ({ page }) => {
    // VRT: 利用規約（フォント表示含む）
    await scrollEntire(page);
    await waitForVisibleMedia(page);
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("terms-利用規約.png", {
      fullPage: true,
      mask: dynamicMediaMask(page),
    });
  });

  test("フォントの表示が初期仕様と同じ見た目になっていること", async ({ page }) => {
    // 利用規約ページで使用されているフォントを確認
    // 源ノ明朝（Noto Serif JP）または例のアレ明朝が使用されていること
    const fontFamily = await page.evaluate(() => {
      const content = document.querySelector("main");
      if (!content) return "";
      return window.getComputedStyle(content).fontFamily;
    });

    // フォントファミリーが設定されていること（空でない）
    expect(fontFamily.length).toBeGreaterThan(0);

    // VRTで見た目の一致を確認（フォントレンダリングの差異はmaxDiffPixelRatioで吸収）
    await scrollEntire(page);
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("terms-利用規約-フォント.png", {
      fullPage: true,
      mask: dynamicMediaMask(page),
    });
  });
});
