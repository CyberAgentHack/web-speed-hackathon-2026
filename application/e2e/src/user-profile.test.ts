import { expect, test } from "@playwright/test";

import { dynamicMediaMask, waitForVisibleMedia } from "./utils";

test.describe("ユーザー詳細", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("タイトルが「{ユーザー名} さんのタイムライン - CaX」", async ({ page }) => {
    await page.goto("/users/o6yq16leo");
    await expect(page).toHaveTitle(/さんのタイムライン - CaX/, {
      timeout: 10_000,
    });
  });

  test("ページ上部がユーザーサムネイル画像の色を抽出した色になっている", async ({ page }) => {
    await page.goto("/users/o6yq16leo");

    const headerDiv = page.locator("header > div").first();
    await expect(headerDiv).toBeVisible({ timeout: 3_000 });

    await expect(async () => {
      const bgColor = await headerDiv.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      // rgb() or oklch() etc — just verify it's not empty/transparent
      expect(bgColor).toBeTruthy();
      expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
    }).toPass({ timeout: 3_000 });

    // VRT: ユーザー詳細（無限スクロールがあるため viewport のみ）
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("user-profile-ユーザー詳細.png", {
      fullPage: false,
      mask: dynamicMediaMask(page),
    });
  });

  test("サービス利用開始の日時が正しく表示されること", async ({ page }) => {
    await page.goto("/users/o6yq16leo");

    // 「からサービスを利用しています」テキストが表示されること
    await expect(page.getByText("からサービスを利用しています")).toBeVisible({ timeout: 3_000 });

    // time要素にdatetime属性が設定されていること
    const timeElement = page.locator("header time");
    await expect(timeElement).toBeVisible({ timeout: 3_000 });

    const datetime = await timeElement.getAttribute("datetime");
    expect(datetime).toBeTruthy();
    // ISO 8601形式であること
    expect(new Date(datetime!).getTime()).not.toBeNaN();

    // 日本語の日付表示がされていること（例: "2026年1月1日"）
    const dateText = await timeElement.innerText();
    expect(dateText).toMatch(/\d{4}年\d{1,2}月\d{1,2}日/);
  });
});
