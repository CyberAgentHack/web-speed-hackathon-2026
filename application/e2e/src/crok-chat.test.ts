import { expect, test } from "@playwright/test";

import { dynamicMediaMask, login, waitForPageToLoad, waitForVisibleMedia } from "./utils";

test.describe("Crok（AIチャット） - サイドバー表示", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("サインイン済みの場合、サイドバーにCrokのリンクが表示されること", async ({ page }) => {
    await login(page);
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Crok" }).first()).toBeVisible({ timeout: 3_000 });
  });

  test("未サインインの場合、Crokのリンクが表示されないこと", async ({ page }) => {
    await page.goto("/");
    await page.locator("article").first().waitFor({ timeout: 3_000 });
    await expect(page.getByRole("link", { name: "Crok" })).toHaveCount(0);
  });
});

test.describe("Crok AIチャット", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.getByRole("link", { name: "Crok" }).click();
    await page.waitForURL("**/crok", { timeout: 3_000, waitUntil: "commit" });
  });

  test("タイトルが「Crok - CaX」となること", async ({ page }) => {
    await expect(page).toHaveTitle("Crok - CaX", { timeout: 3_000 });
  });

  test("初回表示時にウェルカム画面「AIアシスタントに質問してみましょう」が表示されること", async ({
    page,
  }) => {
    await expect(page.getByText("AIアシスタントに質問してみましょう")).toBeVisible({
      timeout: 3_000,
    });

    // VRT: Crokページ
    await waitForVisibleMedia(page);
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("crok-Crok.png", {
      mask: dynamicMediaMask(page),
    });
  });

  test("サジェスト候補が10件表示され、入力内容で絞り込まれること", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.pressSequentially("TypeScriptの型");

    const suggestions = page.getByRole("listbox", { name: "サジェスト候補" });
    await suggestions.waitFor({ timeout: 10_000 });

    const buttons = suggestions.locator("button");

    // 10件表示されること
    await expect(async () => {
      const count = await buttons.count();
      expect(count).toBe(10);
    }).toPass({ timeout: 5_000 });

    // サジェスト候補が入力内容に基づいて絞り込まれていること
    const texts = await buttons.allInnerTexts();
    expect(texts.some((t) => /TypeScript|型/.test(t))).toBe(true);

    // VRT: サジェスト表示後
    await waitForVisibleMedia(page);
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("crok-サジェスト表示後.png", {
      mask: dynamicMediaMask(page),
    });
  });

  test("サジェスト候補をクリックすると、入力欄にテキストが反映されること", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.pressSequentially("TypeScriptの型");

    const suggestions = page.getByRole("listbox", { name: "サジェスト候補" });
    await suggestions.waitFor({ timeout: 10_000 });

    const firstSuggestion = suggestions.locator("button").first();
    const suggestionText = await firstSuggestion.innerText();
    await firstSuggestion.click();

    // 入力欄にサジェストのテキストが反映されること
    await expect(chatInput).toHaveValue(suggestionText);

    // サジェスト候補が閉じること
    await expect(suggestions).not.toBeVisible();
  });

  test("サジェスト候補にマッチした名詞がハイライトされること", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.pressSequentially("TypeScriptの型");

    const suggestions = page.getByRole("listbox", { name: "サジェスト候補" });
    await suggestions.waitFor({ timeout: 10_000 });

    // ハイライトされた要素が存在すること（bg-cax-highlight クラス）
    const highlights = suggestions.locator("span.bg-cax-highlight");
    await expect(async () => {
      const count = await highlights.count();
      expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 3_000 });
  });

  test("質問を送信するとAIの応答がSSEでストリーミング表示される", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    const prompt =
      "『走れメロス』って、冷笑系の\u201Cどうせ人なんか信じても無駄\u201Dに対する話なんだと思うんだけどどう？";
    await chatInput.fill(prompt);

    // 送信ボタンをクリック
    await page.getByRole("button", { name: "送信" }).click();

    // ユーザーメッセージが表示される
    await expect(page.getByText(prompt)).toBeVisible({
      timeout: 3_000,
    });

    // ストリーミング中は送信ボタンが無効化される
    await expect(page.getByRole("button", { name: "送信" })).toBeDisabled({
      timeout: 3_000,
    });

    // ストリーミング中の表示を確認
    await expect(page.getByText("AIが応答を生成中...")).toBeVisible({
      timeout: 3_000,
    });

    // SSE完了を待つ（フッターテキストが変わる）
    await expect(page.getByText("Crok AIは間違いを起こす可能性があります。")).toBeVisible({
      timeout: 300_000,
    });

    // レスポンス内容が表示されている（固定レスポンスの冒頭）
    await expect(page.getByText("結論から言うね")).toBeVisible();

    // 送信ボタンが再び有効化されること
    await chatInput.fill("test");
    await expect(page.getByRole("button", { name: "送信" })).toBeEnabled();

    // VRT: AI応答完了後
    await waitForVisibleMedia(page);
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("crok-AI応答完了後.png", {
      mask: dynamicMediaMask(page),
    });
  });

  test("AIのレスポンスにMarkdownが正しくレンダリングされること", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.fill("テスト");
    await page.getByRole("button", { name: "送信" }).click();

    // SSE完了を待つ
    await expect(page.getByText("Crok AIは間違いを起こす可能性があります。")).toBeVisible({
      timeout: 300_000,
    });

    // コードブロックがシンタックスハイライトされていること
    // react-syntax-highlighter が pre > code を生成する
    const codeBlocks = page.locator("pre code");
    await expect(async () => {
      const count = await codeBlocks.count();
      expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 5_000 });

    // 数式がレンダリングされていること（KaTeX）
    const mathElements = page.locator(".katex");
    await expect(async () => {
      const count = await mathElements.count();
      expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 5_000 });
  });

  test("Enterでメッセージを送信、Shift+Enterで改行できること", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");

    // Shift+Enterで改行
    await chatInput.click();
    await chatInput.pressSequentially("1行目", { delay: 10 });
    await page.keyboard.press("Shift+Enter");
    await chatInput.pressSequentially("2行目", { delay: 10 });

    // テキストエリアに改行が含まれていること
    const value = await chatInput.inputValue();
    expect(value).toContain("\n");

    // Enterで送信
    await page.keyboard.press("Enter");

    // ユーザーメッセージが表示される
    await expect(page.getByText("1行目")).toBeVisible({ timeout: 3_000 });
  });
});
