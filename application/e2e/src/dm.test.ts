import { expect, test } from "@playwright/test";

import { login, scrollEntire, waitForPageToLoad } from "./utils";

test.describe("DM一覧", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("DM一覧が表示される", async ({ page }) => {
    await login(page);
    await page.goto("/dm");

    await expect(page.getByRole("heading", { name: "ダイレクトメッセージ" })).toBeVisible({
      timeout: 30_000,
    });

    // VRT: DM一覧
    await scrollEntire(page);
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("dm-DM一覧.png", {
      fullPage: true,
    });
  });

  test("DM一覧が最後にやり取りをした順にソートされる", async ({ page }) => {
    await login(page);
    await page.goto("/dm");

    const timeElements = await page.getByTestId("dm-list").locator("li time").all();
    const times = await Promise.all(
      timeElements.map(async (element) => {
        return await element.getAttribute("datetime");
      }),
    );

    const sortedTimes = [...times].sort((a, b) => {
      return new Date(b ?? "").getTime() - new Date(a ?? "").getTime();
    });

    expect(times).toEqual(sortedTimes);
  });

  test("新規DM開始モーダルが初期仕様通りにバリデーションされること", async ({ page }) => {
    await login(page);
    await page.goto("/dm");

    await page.getByRole("button", { name: "新しくDMを始める" }).click();
    await page
      .getByRole("dialog")
      .getByRole("heading", { name: "新しくDMを始める" })
      .waitFor({ timeout: 30_000 });

    const usernameInput = page.getByRole("dialog").getByRole("textbox", { name: "ユーザー名" });
    const submitButton = page.getByRole("dialog").getByRole("button", { name: "DMを開始" });
    const cancelButton = page.getByRole("dialog").getByRole("button", { name: "キャンセル" });

    await expect(submitButton).toBeDisabled();

    await usernameInput.click();
    await usernameInput.pressSequentially("@     ", { delay: 10 });
    await usernameInput.blur();
    await expect(submitButton).toBeDisabled();

    // VRT: 新規DM開始モーダル（バリデーションエラー）
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("dm-新規DM開始モーダル（バリデーションエラー）.png");

    await cancelButton.click();
    await page.getByRole("button", { name: "新しくDMを始める" }).click();
    await page
      .getByRole("dialog")
      .getByRole("heading", { name: "新しくDMを始める" })
      .waitFor({ timeout: 30_000 });

    await usernameInput.click();
    await usernameInput.pressSequentially("user_does_not_exist", { delay: 10 });
    await usernameInput.blur();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(page.getByText("ユーザーが見つかりませんでした")).toBeVisible({
      timeout: 30_000,
    });

    // VRT: 新規DM開始モーダル（存在しないユーザー名）
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("dm-新規DM開始モーダル（存在しないユーザー名）.png");
  });

  test("送信ボタンをクリックすると、DM詳細画面に遷移すること", async ({ page }) => {
    await login(page);
    await page.goto("/dm");

    await page.getByRole("button", { name: "新しくDMを始める" }).click();
    await page
      .getByRole("dialog")
      .getByRole("heading", { name: "新しくDMを始める" })
      .waitFor({ timeout: 30_000 });

    const usernameInput = page.getByRole("dialog").getByRole("textbox", { name: "ユーザー名" });
    const submitButton = page.getByRole("dialog").getByRole("button", { name: "DMを開始" });

    await usernameInput.click();
    await usernameInput.pressSequentially("p72k8qi1c3", { delay: 10 });
    await usernameInput.blur();
    await submitButton.click();

    await page.waitForURL("**/dm/*", { timeout: 30_000 });

    await expect(page.getByRole("heading", { name: "滝沢 裕美" })).toBeVisible({
      timeout: 30 * 1000,
    });

    // VRT: DM詳細
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("dm-DM詳細.png");
  });

  test("DM詳細画面でメッセージが古い順に表示されること", async ({ page }) => {
    await login(page);
    await page.goto("/dm");

    await page.getByRole("link", { name: "p72k8qi1c3" }).click();
    await page.waitForURL("**/dm/*", { timeout: 30 * 1000 });

    const messageList = await page.getByTestId("dm-message-list").locator("li time").all();
    const times = await Promise.all(
      messageList.map(async (element) => {
        return await element.getAttribute("datetime");
      }),
    );

    const sortedTimes = [...times].sort((a, b) => {
      return new Date(a ?? "").getTime() - new Date(b ?? "").getTime();
    });

    expect(times).toEqual(sortedTimes);
  });

  test("Enterでメッセージを送信・Shift+Enterで改行できること", async ({ page }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await page.getByRole("link", { name: "gg3hlb16" }).click();
    await page.waitForURL("**/dm/*", { timeout: 30 * 1000 });

    const messageInput = page.getByRole("textbox", { name: "内容" });

    const now = `【${new Date().toISOString()}】`;

    await messageInput.click();
    await messageInput.pressSequentially(now, { delay: 10 });
    await page.keyboard.press("Shift+Enter");
    await messageInput.pressSequentially("こんにちは", { delay: 10 });
    await page.keyboard.press("Shift+Enter");
    await messageInput.pressSequentially("こちらはテストです", { delay: 10 });
    await page.keyboard.press("Enter");

    const lastMessage = page.getByTestId("dm-message-list").locator("li").last();
    await expect(lastMessage).toContainText(now);
  });

  test("相手が入力中の場合、入力中のインジケータが表示されること", async ({ page, browser }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await page.getByRole("link", { name: "g16hmw55" }).click();
    await page.waitForURL("**/dm/*", { timeout: 30 * 1000 });

    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "g16hmw55");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 30 * 1000 });

    await expect(page.getByText("入力中…")).not.toBeVisible({ timeout: 30 * 1000 });

    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially("こんにちは", { delay: 10 });

    await expect(page.getByText("入力中…")).toBeVisible({ timeout: 30 * 1000 });
  });

  test("メッセージ・既読がリアルタイムで更新されること", async ({ page, browser }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await page.getByRole("link", { name: "jirgqx22" }).click();
    await page.waitForURL("**/dm/*", { timeout: 30 * 1000 });

    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "jirgqx22");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 30 * 1000 });

    const now = `【${new Date().toISOString()}】`;

    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(now, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    const pageLastMessage = page.getByTestId("dm-message-list").locator("li").last();
    const peerLastMessage = peerPage.getByTestId("dm-message-list").locator("li").last();

    await expect(pageLastMessage).toContainText(now);
    await expect(peerLastMessage).toContainText(now);
    await expect(peerLastMessage).toContainText("既読");
  });
});
