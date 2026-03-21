import { expect, test } from "@playwright/test";

import { login, scrollEntire } from "./utils";

test.describe("DM機能 - サイドバー表示", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("サインイン済みの場合、サイドバーに DM のリンクが表示されること", async ({ page }) => {
    await login(page);
    await page.goto("/");
    await expect(page.getByRole("link", { name: "DM" }).first()).toBeVisible({ timeout: 3_000 });
  });

  test("未サインインの場合、DM のリンクが表示されないこと", async ({ page }) => {
    await page.goto("/");
    await page.locator("article").first().waitFor({ timeout: 3_000 });
    await expect(page.getByRole("link", { name: "DM" })).toHaveCount(0);
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

  test("タイトルが「ダイレクトメッセージ - CaX」となること", async ({ page }) => {
    await login(page);
    await page.goto("/dm");
    await expect(page).toHaveTitle("ダイレクトメッセージ - CaX", { timeout: 3_000 });
  });

  test("メッセージの送受信をしたことのある全てのユーザーが一覧表示されること", async ({ page }) => {
    await login(page);
    await page.goto("/dm");

    const dmList = page.getByTestId("dm-list");
    await expect(dmList).toBeVisible({ timeout: 5_000 });

    // シードデータの会話相手数 = 10
    await expect(async () => {
      expect(await dmList.locator("li").count()).toBe(10);
    }).toPass({ timeout: 5_000 });
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

  test("ユーザー名、プロフィール画像、最新のメッセージ本文、最終やり取りからの経過時間が表示されること", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/dm");

    const dmList = page.getByTestId("dm-list");
    await expect(dmList).toBeVisible({ timeout: 3_000 });

    const firstItem = dmList.locator("li").first();

    // プロフィール画像
    const profileImage = firstItem.locator("img");
    await expect(profileImage).toBeVisible();

    // ユーザー名（@で始まる）
    await expect(firstItem.locator("text=@")).toBeVisible();

    // 最新メッセージ本文（line-clamp-2）
    const messagePreview = firstItem.locator("p.line-clamp-2");
    await expect(messagePreview).toBeVisible();

    // 経過時間（time要素）
    const timeElement = firstItem.locator("time");
    await expect(timeElement).toBeVisible();
    const datetime = await timeElement.getAttribute("datetime");
    expect(datetime).toBeTruthy();
  });

  test("未読のメッセージがある場合は「未読」のバッジが表示されること", async ({
    page,
    browser,
  }) => {
    // peerからメッセージ送信して確実に未読を作る
    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "g16hmw55");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });
    await expect(peerPage.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    const marker = `unread-badge-${Date.now().toString(36)}`;
    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(marker, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // 送信完了を待つ
    await expect(peerPage.getByTestId("dm-message-list").locator("li").last()).toContainText(
      marker,
      { timeout: 10_000 },
    );
    await peerContext.close();

    // gg3i6j6 でログインしてDM一覧を開く
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    const dmList = page.getByTestId("dm-list");
    await expect(dmList).toBeVisible({ timeout: 5_000 });

    // 未読バッジが表示されていること（条件分岐なし）
    await expect(dmList.getByText("未読").first()).toBeVisible({ timeout: 5_000 });
  });

  test("新規メッセージを受信した場合、画面がリアルタイムで更新されること", async ({
    page,
    browser,
  }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    const dmList = page.getByTestId("dm-list");
    await expect(dmList).toBeVisible({ timeout: 3_000 });

    // 別ユーザーからメッセージを送信
    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "g16hmw55");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    // WebSocket接続確立を待つ
    await expect(peerPage.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    const now = `【realtime-${Date.now().toString(36)}】`;
    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(now, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // DM一覧のメッセージプレビューがリアルタイムで更新されること
    await expect(async () => {
      const listText = await dmList.innerText();
      expect(listText).toContain(now);
    }).toPass({ timeout: 15_000 });

    await peerContext.close();
  });

  test("新規DM開始モーダルが初期仕様通りにバリデーションされること", async ({ page }) => {
    await login(page);
    await page.goto("/dm");

    await page.getByRole("button", { name: "新しくDMを始める" }).click();
    await page
      .getByRole("dialog")
      .getByRole("heading", { name: "新しくDMを始める" })
      .waitFor({ timeout: 10 * 1000 });

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
      .waitFor({ timeout: 10 * 1000 });

    await usernameInput.click();
    await usernameInput.pressSequentially("user_does_not_exist", { delay: 10 });
    await usernameInput.blur();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(page.getByText("ユーザーが見つかりませんでした")).toBeVisible({
      timeout: 10 * 1000,
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
      .waitFor({ timeout: 10 * 1000 });

    const usernameInput = page.getByRole("dialog").getByRole("textbox", { name: "ユーザー名" });
    const submitButton = page.getByRole("dialog").getByRole("button", { name: "DMを開始" });

    await usernameInput.click();
    await usernameInput.pressSequentially("p72k8qi1c3", { delay: 10 });
    await usernameInput.blur();
    await submitButton.click();

    await page.waitForURL("**/dm/*", { timeout: 10 * 1000, waitUntil: "commit" });

    await expect(page.getByRole("heading", { name: "滝沢 裕美" })).toBeVisible({
      timeout: 10 * 1000,
    });

    // VRT: DM詳細
    await expect(page).toHaveScreenshot("dm-DM詳細.png");
  });
});

test.describe("DM詳細画面", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("タイトルが「{相手のユーザー名} さんとのダイレクトメッセージ - CaX」となること", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/dm");
    await page.getByRole("link", { name: "p72k8qi1c3" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    await expect(page).toHaveTitle(/さんとのダイレクトメッセージ - CaX/, { timeout: 3_000 });
  });

  test("メッセージの送受信履歴が表示されること", async ({ page }) => {
    await login(page);
    await page.goto("/dm");
    await page.getByRole("link", { name: "p72k8qi1c3" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    const messageList = page.getByTestId("dm-message-list");
    await expect(messageList).toBeVisible({ timeout: 3_000 });

    const messages = messageList.locator("li");
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("メッセージが古い順に表示されること", async ({ page }) => {
    await login(page);
    await page.goto("/dm");

    await page.getByRole("link", { name: "p72k8qi1c3" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

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

  test("メッセージにはメッセージ本文、送信時間が表示されること", async ({ page }) => {
    await login(page);
    await page.goto("/dm");
    await page.getByRole("link", { name: "p72k8qi1c3" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    const firstMessage = page.getByTestId("dm-message-list").locator("li").first();
    await expect(firstMessage).toBeVisible({ timeout: 3_000 });

    // メッセージ本文（p要素）
    const messageBody = firstMessage.locator("p");
    await expect(messageBody).toBeVisible();
    const bodyText = await messageBody.innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    // 送信時間（time要素）
    const timeElement = firstMessage.locator("time");
    await expect(timeElement).toBeVisible();
  });

  test("初期表示で画面が一番下までスクロールされていること", async ({ page }) => {
    await login(page);
    await page.goto("/dm");
    await page.getByRole("link", { name: "p72k8qi1c3" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    // メッセージリストが表示されるのを待つ
    await expect(page.getByTestId("dm-message-list")).toBeVisible({ timeout: 3_000 });

    // ページが一番下にスクロールされていることを確認
    await expect(async () => {
      const isScrolledToBottom = await page.evaluate(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.body.scrollHeight;
        const clientHeight = window.innerHeight;
        // 誤差10px以内で最下部にいること
        return scrollTop + clientHeight >= scrollHeight - 10;
      });
      expect(isScrolledToBottom).toBe(true);
    }).toPass({ timeout: 5_000 });
  });

  test("自分のメッセージで相手が既読している場合は「既読」のラベルが表示されること", async ({
    page,
    browser,
  }) => {
    // gg3i6j6 → jirgqx22 にメッセージ送信
    await login(page, "gg3i6j6");
    await page.goto("/dm");
    await page.getByRole("link", { name: "jirgqx22" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });
    await expect(page.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    const marker = `read-label-${Date.now().toString(36)}`;
    const messageInput = page.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(marker, { delay: 10 });
    await page.keyboard.press("Enter");

    // 送信完了を待つ
    await expect(page.getByTestId("dm-message-list").locator("li").last()).toContainText(marker, {
      timeout: 10_000,
    });

    // peer(jirgqx22)がDM詳細を開いて既読にする
    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "jirgqx22");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });
    await expect(peerPage.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    // page側で「既読」ラベルが表示されること（条件分岐なし）
    await expect(page.getByTestId("dm-message-list").getByText("既読").first()).toBeVisible({
      timeout: 15_000,
    });

    await peerContext.close();
  });

  test("メッセージの入力が初期仕様通りにバリデーションされること", async ({ page }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");
    await page.getByRole("link", { name: "gg3hlb16" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });
    await expect(page.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    const messageInput = page.getByRole("textbox", { name: "内容" });
    const messagesBefore = await page.getByTestId("dm-message-list").locator("li").count();

    // 空入力でEnter → 送信されないこと
    await messageInput.click();
    await page.keyboard.press("Enter");
    await expect(async () => {
      expect(await page.getByTestId("dm-message-list").locator("li").count()).toBe(messagesBefore);
    }).toPass({ timeout: 3_000 });

    // 空白のみ入力でEnter → 送信されないこと
    await messageInput.click();
    await messageInput.pressSequentially("   ", { delay: 10 });
    await page.keyboard.press("Enter");
    await expect(async () => {
      expect(await page.getByTestId("dm-message-list").locator("li").count()).toBe(messagesBefore);
    }).toPass({ timeout: 3_000 });
  });

  test("未読のメッセージがある状態でDM詳細画面を開いた場合、未読のメッセージが既読になること", async ({
    page,
    browser,
  }) => {
    // 両方のcontextを先に確立する
    await login(page, "gg3i6j6");
    await page.goto("/dm");
    const dmList = page.getByTestId("dm-list");
    await expect(dmList).toBeVisible({ timeout: 5_000 });

    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "g16hmw55");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });
    await expect(peerPage.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    // peerからメッセージ送信して未読を作る
    const marker = `unread-to-read-${Date.now().toString(36)}`;
    const peerInput = peerPage.getByRole("textbox", { name: "内容" });
    await peerInput.click();
    await peerInput.pressSequentially(marker, { delay: 10 });
    await peerPage.keyboard.press("Enter");
    await expect(peerPage.getByTestId("dm-message-list").locator("li").last()).toContainText(
      marker,
      { timeout: 10_000 },
    );

    // DM一覧に未読バッジが表示されるまで待つ
    await expect(dmList.getByText("未読").first()).toBeVisible({ timeout: 15_000 });

    // DM詳細画面を開く
    await page.getByRole("link", { name: "g16hmw55" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });
    await expect(page.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    // peerがもう1通送信 → WebSocket受信でsendRead()が発火し既読になる
    const marker2 = `read-trigger-${Date.now().toString(36)}`;
    await peerInput.click();
    await peerInput.pressSequentially(marker2, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // page側でメッセージ受信を確認（sendReadが発火する）
    await expect(page.getByTestId("dm-message-list").locator("li").last()).toContainText(marker2, {
      timeout: 15_000,
    });

    await peerContext.close();

    // DM一覧に戻って未読バッジが消えていることを確認
    await page.goto("/dm", { waitUntil: "domcontentloaded" });
    const dmListReloaded = page.getByTestId("dm-list");
    await expect(dmListReloaded).toBeVisible({ timeout: 5_000 });

    const g16hmw55Item = dmListReloaded.locator("li").filter({ hasText: "g16hmw55" });
    await expect(g16hmw55Item).toBeVisible({ timeout: 5_000 });
    await expect(g16hmw55Item.getByText("未読")).not.toBeVisible({ timeout: 10_000 });
  });

  test("Enterでメッセージを送信・Shift+Enterで改行できること", async ({ page }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await page.getByRole("link", { name: "gg3hlb16" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

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
    await page.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    // WebSocket接続確立を待つ（UIの安定を確認）
    await expect(page.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "g16hmw55");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    // 相手側もUIが安定するのを待つ
    await expect(peerPage.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    await expect(page.getByText("入力中…")).not.toBeVisible({ timeout: 10_000 });

    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially("こんにちは", { delay: 10 });

    await expect(page.getByText("入力中…")).toBeVisible({ timeout: 10_000 });

    await peerContext.close();
  });

  test("メッセージの入力を辞めると入力中のインジケータが非表示になること", async ({
    page,
    browser,
  }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await page.getByRole("link", { name: "g16hmw55" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    await expect(page.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "g16hmw55");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    await expect(peerPage.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    // 入力開始
    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially("こんにちは", { delay: 10 });

    // インジケータが表示される
    await expect(page.getByText("入力中…")).toBeVisible({ timeout: 10_000 });

    // 入力を停止（テキストを消してblur）
    await messageInput.clear();
    await messageInput.blur();

    // インジケータが非表示になる
    await expect(page.getByText("入力中…")).not.toBeVisible({ timeout: 15_000 });

    await peerContext.close();
  });

  test("メッセージ・既読がリアルタイムで更新されること", async ({ page, browser }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await page.getByRole("link", { name: "jirgqx22" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    // WebSocket接続確立を待つ
    await expect(page.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "jirgqx22");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    // WebSocket接続確立を待つ
    await expect(peerPage.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    const now = `【${new Date().toISOString()}】`;

    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(now, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    const pageLastMessage = page.getByTestId("dm-message-list").locator("li").last();
    const peerLastMessage = peerPage.getByTestId("dm-message-list").locator("li").last();

    // 新規メッセージがリアルタイムで表示される
    await expect(pageLastMessage).toContainText(now);
    await expect(peerLastMessage).toContainText(now);

    // リアルタイムで既読になる
    await expect(peerLastMessage).toContainText("既読");

    await peerContext.close();
  });

  test("新規メッセージを受信した場合、画面が一番下までスクロールされること", async ({
    page,
    browser,
  }) => {
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await page.getByRole("link", { name: "jirgqx22" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    await expect(page.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "jirgqx22");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    await expect(peerPage.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    const now = `【scroll-${Date.now().toString(36)}】`;

    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(now, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // 新規メッセージが表示されるのを待つ
    await expect(page.getByTestId("dm-message-list").locator("li").last()).toContainText(now, {
      timeout: 10_000,
    });

    // 画面が一番下にスクロールされていること
    await expect(async () => {
      const isScrolledToBottom = await page.evaluate(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.body.scrollHeight;
        const clientHeight = window.innerHeight;
        return scrollTop + clientHeight >= scrollHeight - 10;
      });
      expect(isScrolledToBottom).toBe(true);
    }).toPass({ timeout: 5_000 });

    await peerContext.close();
  });
});

test.describe("未読バッジ", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("未読のメッセージがある場合はメニューに未読数のバッジが表示されること", async ({
    page,
    browser,
  }) => {
    // ユーザーAでログインしてDMページを開く
    await login(page, "gg3i6j6");
    await page.goto("/");

    // 別ユーザーからメッセージを送信して未読を作る
    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "g16hmw55");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });

    await expect(peerPage.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    const now = `【badge-${Date.now().toString(36)}】`;
    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(now, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // ホームページのDMバッジが更新されること（リアルタイム更新）
    await expect(page.locator("nav").locator(".bg-cax-danger")).toBeVisible({ timeout: 15_000 });

    await peerContext.close();
  });

  test("99件を超える場合は「99+」と表示されること", async ({ page, browser }) => {
    await login(page, "gg3i6j6");
    await page.goto("/");

    // peerからAPI直接呼び出しで大量メッセージを送信（UI操作より高速）
    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "g16hmw55");

    // DM会話IDを取得
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });
    await expect(peerPage.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    // URLからconversationIdを抽出
    const url = peerPage.url();
    const conversationId = url.split("/dm/")[1];

    // API直接呼び出しで100件送信
    for (let i = 0; i < 100; i++) {
      await peerPage.evaluate(
        async ({ id, idx }) => {
          await fetch(`/api/v1/dm/${id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: `99plus-test-${idx}` }),
          });
        },
        { id: conversationId, idx: i },
      );
    }

    await peerContext.close();

    // バッジが「99+」になること
    await expect(page.locator("nav").locator(".bg-cax-danger")).toContainText("99+", {
      timeout: 15_000,
    });
  });

  test("どのページからでも未読数がリアルタイムで更新されること", async ({ page, browser }) => {
    // /search ページで検証
    await login(page, "gg3i6j6");
    await page.goto("/search");
    await expect(page).toHaveTitle("検索 - CaX", { timeout: 5_000 });

    // peerからメッセージ送信
    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "g16hmw55");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000, waitUntil: "commit" });
    await expect(peerPage.getByTestId("dm-message-list")).toBeVisible({ timeout: 5_000 });

    const marker = `cross-page-${Date.now().toString(36)}`;
    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(marker, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // /search ページでもDMバッジがリアルタイム更新されること
    await expect(page.locator("nav").locator(".bg-cax-danger")).toBeVisible({ timeout: 15_000 });

    await peerContext.close();
  });
});
