import { expect, test } from "@playwright/test";

import { scrollEntire, waitForVisibleMedia } from "./utils";

test.describe("利用規約", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/terms", { waitUntil: "domcontentloaded" });
  });

  test("タイトルが「利用規約 - CaX」となること", async ({ page }) => {
    await expect(page).toHaveTitle("利用規約 - CaX", { timeout: 5_000 });
  });

  test("フォントの表示が初期仕様と同じ見た目になっていること", async ({ page }) => {
    // 利用規約の見出しが表示されるまで待機
    const h1 = page.getByRole("heading", { name: "利用規約", exact: true });
    await expect(h1).toBeVisible({ timeout: 5_000 });

    // コンテンツが正しく表示されていることを確認
    await expect(page.getByText("第1条（適用）")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("第16条（準拠法・裁判管轄）")).toBeVisible({ timeout: 5_000 });

    // フォントの読み込み完了を待機
    await page.evaluate(() => document.fonts.ready);

    // 全体をスクロールして遅延コンテンツを読み込む
    await scrollEntire(page);
    await waitForVisibleMedia(page);

    // VRT: フォント表示を含むページ全体のスクリーンショット
    // toHaveScreenshot は内部で2連続同一スクリーンショットを待つため手動安定化は最小限でOK
    await expect(page).toHaveScreenshot("terms-利用規約.png", {
      fullPage: true,
    });
  });
});
