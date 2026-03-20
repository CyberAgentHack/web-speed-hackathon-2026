import { expect, test } from "@playwright/test";

import { login, scrollEntire } from "./utils";

test.describe("DM - 未サインイン", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("未サインインの場合、DMのリンクが表示されない", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // タイムラインが表示されるまで待つ
    await expect(page.locator("article").first()).toBeVisible({ timeout: 30_000 });

    // ナビゲーション内に DM リンクが存在しないことを確認
    const dmLink = page.getByRole("link", { name: "DM" });
    await expect(dmLink).not.toBeVisible({ timeout: 10_000 });
  });
});

test.describe("DM一覧", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("DM一覧が表示される", async ({ page }) => {
    await page.goto("/dm");

    // VRT: DM一覧
    await scrollEntire(page);
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

  test("メッセージの入力を辞めると入力中のインジケータが非表示になる", async ({ page, browser }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await page.getByRole("link", { name: "g16hmw55" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10 * 1000 });

    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "g16hmw55");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10 * 1000 });

    // 相手が入力する
    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially("テスト", { delay: 10 });

    // 入力中インジケータが表示される
    await expect(page.getByText("入力中…")).toBeVisible({ timeout: 10 * 1000 });

    // 相手がテキストをクリアして入力を止める
    await messageInput.fill("");

    // typing indicator の timeout (10秒) を待つ
    // インジケータが非表示になることを確認
    await expect(page.getByText("入力中…")).not.toBeVisible({ timeout: 15 * 1000 });

    await peerContext.close();
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

test.describe("DM詳細 - 追加テスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("新規メッセージを受信した場合、DM一覧画面がリアルタイムで更新される", async ({ page, browser }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    // DM一覧が表示されるまで待つ
    await expect(page.getByTestId("dm-list")).toBeVisible({ timeout: 30_000 });

    // 相手がメッセージを送信する
    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "jirgqx22");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10 * 1000 });

    const now = `【DM一覧更新テスト${Date.now()}】`;
    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(now, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // DM一覧で新しいメッセージが反映されることを確認
    await expect(page.getByText(now)).toBeVisible({ timeout: 30_000 });

    await peerContext.close();
  });

  test("初期表示で画面が一番下までスクロールされている", async ({ page }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await page.getByRole("link", { name: "jirgqx22" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10 * 1000 });

    // メッセージリストが表示されるまで待つ
    const messageList = page.getByTestId("dm-message-list");
    await expect(messageList).toBeVisible({ timeout: 10 * 1000 });

    // ページが一番下までスクロールされていることを確認
    await expect(async () => {
      const isScrolledToBottom = await page.evaluate(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.body.scrollHeight;
        const clientHeight = window.innerHeight;
        // スクロール位置がページの底辺付近であること（100px の許容範囲）
        return scrollTop + clientHeight >= scrollHeight - 100;
      });
      expect(isScrolledToBottom).toBe(true);
    }).toPass({ timeout: 30_000 });
  });

  test("自分のメッセージで相手が既読している場合は「既読」のラベルが表示される", async ({ page }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await page.getByRole("link", { name: "jirgqx22" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10 * 1000 });

    // メッセージリストが表示されるまで待つ
    const messageList = page.getByTestId("dm-message-list");
    await expect(messageList).toBeVisible({ timeout: 10 * 1000 });

    // 自分のメッセージ（items-end で右寄せ）に「既読」ラベルがあること
    const myMessages = messageList.locator("li.items-end");
    const count = await myMessages.count();

    if (count > 0) {
      // 少なくとも1つの自分のメッセージに「既読」が含まれることを確認
      let hasReadLabel = false;
      for (let i = 0; i < count; i++) {
        const text = await myMessages.nth(i).innerText();
        if (text.includes("既読")) {
          hasReadLabel = true;
          break;
        }
      }
      expect(hasReadLabel).toBe(true);
    }
  });

  test("未読のメッセージがある状態でDM詳細画面を開いた場合、未読のメッセージが既読になる", async ({ page, browser }) => {
    // 相手からメッセージを送信する
    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "jirgqx22");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10 * 1000 });

    const now = `【未読テスト${Date.now()}】`;
    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(now, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // メッセージが送信されたことを確認
    const peerLastMessage = peerPage.getByTestId("dm-message-list").locator("li").last();
    await expect(peerLastMessage).toContainText(now, { timeout: 10 * 1000 });

    // 自分がDM詳細画面を開く
    await login(page, "gg3i6j6");
    await page.goto("/dm");
    await page.getByRole("link", { name: "jirgqx22" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10 * 1000 });

    // メッセージリストが表示されるまで待つ
    await expect(page.getByTestId("dm-message-list")).toBeVisible({ timeout: 10 * 1000 });

    // 相手側で「既読」が表示されることを確認（自分がページを開いたことで既読になる）
    await expect(async () => {
      const peerLastMsg = peerPage.getByTestId("dm-message-list").locator("li").last();
      await expect(peerLastMsg).toContainText("既読");
    }).toPass({ timeout: 30_000 });

    await peerContext.close();
  });

  test("新規メッセージを受信した場合、リアルタイムで相手のメッセージ履歴が既読になる", async ({ page, browser }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await page.getByRole("link", { name: "jirgqx22" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10 * 1000 });

    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "jirgqx22");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10 * 1000 });

    const now = `【既読リアルタイムテスト${Date.now()}】`;

    // 相手がメッセージを送信
    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(now, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // 自分の画面でメッセージが表示されたことを確認
    await expect(page.getByText(now)).toBeVisible({ timeout: 30_000 });

    // 相手側で自分のメッセージが「既読」になっていることを確認
    await expect(async () => {
      const peerLastMsg = peerPage.getByTestId("dm-message-list").locator("li").last();
      await expect(peerLastMsg).toContainText("既読");
    }).toPass({ timeout: 30_000 });

    await peerContext.close();
  });

  test("新規メッセージを受信した場合、画面が一番下までスクロールされる", async ({ page, browser }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await page.getByRole("link", { name: "jirgqx22" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10 * 1000 });

    // メッセージリストが表示されるまで待つ
    await expect(page.getByTestId("dm-message-list")).toBeVisible({ timeout: 10 * 1000 });

    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "jirgqx22");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10 * 1000 });

    const now = `【スクロールテスト${Date.now()}】`;

    // 相手がメッセージを送信
    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(now, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // 自分の画面でメッセージが表示されるのを待つ
    await expect(page.getByText(now)).toBeVisible({ timeout: 30_000 });

    // 画面が一番下までスクロールされていることを確認
    await expect(async () => {
      const isScrolledToBottom = await page.evaluate(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.body.scrollHeight;
        const clientHeight = window.innerHeight;
        return scrollTop + clientHeight >= scrollHeight - 100;
      });
      expect(isScrolledToBottom).toBe(true);
    }).toPass({ timeout: 10_000 });

    await peerContext.close();
  });
});

test.describe("DM - 未読バッジ", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("未読のメッセージがある場合はメニューに未読数のバッジが表示される", async ({ page, browser }) => {
    await login(page, "gg3i6j6");
    await page.goto("/");

    // ページが表示されるまで待つ
    await expect(page.locator("article").first()).toBeVisible({ timeout: 30_000 });

    // 相手からメッセージを送信して未読を作る
    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "jirgqx22");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10 * 1000 });

    const now = `【バッジテスト${Date.now()}】`;
    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(now, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // 自分の画面でバッジが表示されることを確認（WebSocket でリアルタイム更新される）
    await expect(async () => {
      // ナビゲーション内のバッジ（未読数表示）
      const badge = page.locator("nav span.bg-cax-danger");
      await expect(badge).toBeVisible();
      const badgeText = await badge.innerText();
      // 数字または "99+" であること
      expect(badgeText).toMatch(/^\d+\+?$/);
    }).toPass({ timeout: 30_000 });

    await peerContext.close();
  });
});
