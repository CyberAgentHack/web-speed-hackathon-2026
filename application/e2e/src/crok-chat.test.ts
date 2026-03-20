import { expect, test } from "@playwright/test";

import { dynamicMediaMask, login, waitForVisibleMedia } from "./utils";

test.describe("Crok - 未サインイン", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("未サインインの場合、Crokのリンクが表示されない", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // タイムラインが表示されるまで待つ
    await expect(page.locator("article").first()).toBeVisible({ timeout: 30_000 });

    // ナビゲーション内に Crok リンクが存在しないことを確認
    const crokLink = page.getByRole("link", { name: "Crok" });
    await expect(crokLink).not.toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Crok AIチャット", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.getByRole("link", { name: "Crok" }).click();
    await page.waitForURL("**/crok", { timeout: 30_000 });
  });

  test("初回表示時にウェルカム画面「AIアシスタントに質問してみましょう」が表示される", async ({ page }) => {
    // ウェルカム画面のテキストが表示されること
    await expect(page.getByText("AIアシスタントに質問してみましょう")).toBeVisible({ timeout: 30_000 });
    // Crok AI の見出しも表示されること
    await expect(page.getByRole("heading", { name: "Crok AI" })).toBeVisible({ timeout: 10_000 });
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

  test("サジェスト候補をクリックすると入力欄にテキストが反映される", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.pressSequentially("TypeScriptの型");

    const suggestions = page.getByRole("listbox", { name: "サジェスト候補" });
    await suggestions.waitFor({ timeout: 30_000 });

    const firstButton = suggestions.locator("button").first();
    const suggestionText = await firstButton.innerText();
    await firstButton.click();

    // 入力欄にサジェストのテキストが反映されること
    await expect(chatInput).toHaveValue(suggestionText, { timeout: 10_000 });

    // サジェスト候補が閉じること
    await expect(suggestions).not.toBeVisible({ timeout: 10_000 });
  });

  test("サジェスト候補にマッチした名詞がハイライトされる", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.pressSequentially("TypeScriptの型");

    const suggestions = page.getByRole("listbox", { name: "サジェスト候補" });
    await suggestions.waitFor({ timeout: 30_000 });

    // ハイライト要素（bg-cax-highlight クラス）が存在すること
    const highlights = suggestions.locator("span.bg-cax-highlight");
    await expect(highlights.first()).toBeVisible({ timeout: 10_000 });
    const highlightCount = await highlights.count();
    expect(highlightCount).toBeGreaterThan(0);
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

  test("レスポンスが返却されている間は送信ボタンが無効化される", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    const prompt = "テスト質問です";
    await chatInput.fill(prompt);

    // 送信ボタンをクリック
    const sendButton = page.getByRole("button", { name: "送信" });
    await sendButton.click();

    // ストリーミング中に送信ボタンが無効化されていることを確認
    await expect(page.getByText("AIが応答を生成中...")).toBeVisible({ timeout: 10_000 });
    await expect(sendButton).toBeDisabled({ timeout: 10_000 });

    // SSE完了を待つ
    await expect(page.getByText("Crok AIは間違いを起こす可能性があります。")).toBeVisible({
      timeout: 300_000,
    });

    // 完了後は入力すれば送信ボタンが有効になる
    await chatInput.fill("次の質問");
    await expect(sendButton).toBeEnabled({ timeout: 10_000 });
  });

  test("Shift+Enterで改行できる", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.click();
    await chatInput.pressSequentially("1行目", { delay: 10 });
    await page.keyboard.press("Shift+Enter");
    await chatInput.pressSequentially("2行目", { delay: 10 });

    // textarea の値に改行が含まれていることを確認
    const value = await chatInput.inputValue();
    expect(value).toContain("1行目\n2行目");

    // メッセージが送信されていないことを確認（Shift+Enterは改行であり送信ではない）
    // ウェルカム画面がまだ表示されていること
    await expect(page.getByText("AIアシスタントに質問してみましょう")).toBeVisible();
  });
});
