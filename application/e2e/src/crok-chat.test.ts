import { expect, test } from "@playwright/test";

import { dynamicMediaMask, login, waitForVisibleMedia } from "./utils";

test.describe("Crok AIチャット", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.getByRole("link", { name: "Crok" }).click();
    await page.waitForURL("**/crok", { timeout: 30_000 });
  });

  test("サジェスト候補が表示される", async ({ page }) => {
    // VRT: Crokページ
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("crok-Crok.png", {
      mask: dynamicMediaMask(page),
    });

    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.pressSequentially("TypeScriptの型");

    const suggestions = page.getByRole("listbox", { name: "サジェスト候補" });
    await suggestions.waitFor({ timeout: 30_000 });

    const buttons = suggestions.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    const texts = await buttons.allInnerTexts();
    expect(texts.some((t) => /TypeScript|型/.test(t))).toBe(true);

    // VRT: サジェスト表示後
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("crok-サジェスト表示後.png", {
      mask: dynamicMediaMask(page),
    });
  });

  test("質問を送信するとAIの応答が表示される", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    const prompt =
      "『走れメロス』って、冷笑系の“どうせ人なんか信じても無駄”に対する話なんだと思うんだけどどう？";
    await chatInput.fill(prompt);

    // 送信ボタンをクリック
    await page.getByRole("button", { name: "送信" }).click();

    // ユーザーメッセージが表示される
    await expect(page.getByText(prompt)).toBeVisible({
      timeout: 30_000,
    });

    // ストリーミング中の表示を確認
    await expect(page.getByText("AIが応答を生成中...")).toBeVisible({
      timeout: 30_000,
    });

    // SSE完了を待つ（フッターテキストが変わる）
    await expect(page.getByText("Crok AIは間違いを起こす可能性があります。")).toBeVisible({
      timeout: 300_000,
    });

    // レスポンス内容が表示されている（固定レスポンスの冒頭）
    await expect(page.getByText("結論から言うね")).toBeVisible();

    // VRT: AI応答完了後
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("crok-AI応答完了後.png", {
      mask: dynamicMediaMask(page),
    });
  });
});
