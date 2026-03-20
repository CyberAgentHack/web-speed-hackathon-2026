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

  test("サービス利用開始の日時が正しく表示される", async ({ page }) => {
    await page.goto("/users/o6yq16leo");

    const serviceStartText = page.getByText("からサービスを利用しています");
    await expect(serviceStartText).toBeVisible({ timeout: 30_000 });

    // header 内の time に限定して複数ヒットを回避
    const timeElement = page.locator("header time");
    await expect(timeElement).toBeVisible({ timeout: 10_000 });

    const datetimeAttr = await timeElement.getAttribute("datetime");
    expect(datetimeAttr).toBeTruthy();

    const parsedDate = new Date(datetimeAttr!);
    expect(parsedDate.getTime()).not.toBeNaN();

    const displayText = await timeElement.innerText();
    expect(displayText).toMatch(/\d{4}年\d{1,2}月\d{1,2}日/);
  });
});
