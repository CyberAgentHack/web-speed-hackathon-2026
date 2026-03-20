import { expect, test } from "@playwright/test";

import { dynamicMediaMask, scrollEntire, waitForVisibleMedia } from "./utils";

test.describe("利用規約", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/terms");
  });

  test("タイトルが「利用規約 - CaX」", async ({ page }) => {
    await expect(page).toHaveTitle("利用規約 - CaX", { timeout: 10_000 });
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

  test("源ノ明朝（Noto Serif JP）フォントが適用されている", async ({ page }) => {
    // 利用規約ページの h1 に "Rei no Are Mincho" フォントが指定されていることを確認
    // (Source Han Serif JP = 源ノ明朝 = Noto Serif JP の改変フォント)
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 30_000 });

    // CSS の font-family に "Rei_no_Are_Mincho" (Tailwind v4 形式) または "Rei no Are Mincho" が含まれること
    const fontFamily = await heading.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });
    expect(fontFamily).toMatch(/Rei.no.Are.Mincho/i);

    // h2 にも同じフォントが適用されていること
    const h2 = page.locator("h2").first();
    await expect(h2).toBeVisible({ timeout: 10_000 });
    const h2FontFamily = await h2.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });
    expect(h2FontFamily).toMatch(/Rei.no.Are.Mincho/i);
  });
});
