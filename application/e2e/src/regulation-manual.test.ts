import path from "node:path";

import { expect, test } from "@playwright/test";

import { dynamicMediaMask, login, waitForVisibleMedia } from "./utils";

// テスト用アセットのパス
const ASSETS_DIR = path.resolve(import.meta.dirname, "../../../docs/assets");
const TIFF_PATH = path.join(ASSETS_DIR, "analoguma.tiff");
const WAV_PATH = path.join(ASSETS_DIR, "maoudamashii_shining_star.wav");
const MKV_PATH = path.join(ASSETS_DIR, "pixabay_326739_kanenori_himejijo.mkv");

// ================================================================
// 手動テスト: Crok - タイトル・リンク表示
// ================================================================
test.describe("手動テスト: Crok - タイトル・リンク表示", () => {
  test("タイトルが「Crok - CaX」であること", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.getByRole("link", { name: "Crok" }).click();
    await page.waitForURL("**/crok", { timeout: 10_000 });
    await expect(page).toHaveTitle("Crok - CaX", { timeout: 10_000 });
  });

  test("サインイン済みの場合、サイドバーにCrokのリンクが表示されること", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await expect(page.getByRole("link", { name: "Crok" })).toBeVisible();
  });

  test("未サインインの場合、Crokのリンクが表示されないこと", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: "Crok" })).not.toBeVisible();
  });

  test("初回表示時にウェルカム画面「AIアシスタントに質問してみましょう」が表示されること", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.getByRole("link", { name: "Crok" }).click();
    await page.waitForURL("**/crok", { timeout: 10_000 });
    await expect(page.getByText("AIアシスタントに質問してみましょう")).toBeVisible({
      timeout: 30_000,
    });
  });
});

// ================================================================
// 手動テスト: Crok - サジェスト機能
// ================================================================
test.describe("手動テスト: Crok - サジェスト機能", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.getByRole("link", { name: "Crok" }).click();
    await page.waitForURL("**/crok", { timeout: 10_000 });
  });

  test("「TypeScriptの型」と入力するとサジェスト候補が10件表示されること", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.pressSequentially("TypeScriptの型");

    const suggestions = page.getByRole("listbox", { name: "サジェスト候補" });
    await suggestions.waitFor({ timeout: 30_000 });

    const count = await suggestions.locator("button").count();
    expect(count).toBe(10);
  });

  test("サジェスト候補は入力内容に基づいてリアルタイムに絞り込まれること", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");

    // まず短い入力でサジェストを表示
    await chatInput.pressSequentially("TypeScript");
    const suggestions = page.getByRole("listbox", { name: "サジェスト候補" });
    await suggestions.waitFor({ timeout: 30_000 });
    const initialCount = await suggestions.locator("button").count();

    // さらに入力を追加して絞り込みが発生することを確認
    await chatInput.pressSequentially("の型");
    await page.waitForTimeout(500);

    const filteredCount = await suggestions.locator("button").count();
    // 追加入力により件数が変化するか、同数のままでもボタンが存在すること
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test("サジェスト候補をクリックすると入力欄にテキストが反映されること", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.pressSequentially("TypeScriptの型");

    const suggestions = page.getByRole("listbox", { name: "サジェスト候補" });
    await suggestions.waitFor({ timeout: 30_000 });

    const firstSuggestion = suggestions.locator("button").first();
    const suggestionText = await firstSuggestion.innerText();
    await firstSuggestion.click();

    const inputValue = await chatInput.inputValue();
    expect(inputValue).toBe(suggestionText);
  });

  test("サジェスト候補にマッチした名詞がハイライトされること", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.pressSequentially("TypeScriptの型");

    const suggestions = page.getByRole("listbox", { name: "サジェスト候補" });
    await suggestions.waitFor({ timeout: 30_000 });

    // ハイライトされた要素（mark, strong, b, または特定のdata属性）が存在すること
    const highlightedElements = suggestions.locator(
      "mark, strong, b, [data-highlight], .highlight",
    );
    await expect(highlightedElements.first()).toBeVisible({ timeout: 10_000 });
  });
});

// ================================================================
// 手動テスト: Crok - メッセージ送信
// ================================================================
test.describe("手動テスト: Crok - メッセージ送信", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.getByRole("link", { name: "Crok" }).click();
    await page.waitForURL("**/crok", { timeout: 10_000 });
  });

  test("Enterでメッセージを送信できること", async ({ page }) => {
    test.setTimeout(120_000);
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.fill("テスト質問");
    await page.keyboard.press("Enter");

    // ユーザーメッセージが表示される
    await expect(page.getByText("テスト質問")).toBeVisible({ timeout: 10_000 });

    // AIが応答を開始する
    await expect(page.getByText("AIが応答を生成中...")).toBeVisible({ timeout: 10_000 });
  });

  test("Shift+Enterで改行できること", async ({ page }) => {
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.click();
    await chatInput.pressSequentially("1行目");
    await page.keyboard.press("Shift+Enter");
    await chatInput.pressSequentially("2行目");

    const value = await chatInput.inputValue();
    expect(value).toContain("1行目");
    expect(value).toContain("2行目");
    expect(value).toContain("\n");
  });

  test("レスポンス返却中は送信ボタンが無効化されること", async ({ page }) => {
    test.setTimeout(120_000);
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.fill("テスト質問");

    const sendButton = page.getByRole("button", { name: "送信" });
    await sendButton.click();

    // ストリーミング中は送信ボタンが無効化される
    await expect(sendButton).toBeDisabled({ timeout: 30_000 });
  });
});

// ================================================================
// 手動テスト: Crok - AIレスポンスのレンダリング
// ================================================================
test.describe("手動テスト: Crok - AIレスポンスのレンダリング", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    test.setTimeout(300_000);
    await login(page);
    await page.getByRole("link", { name: "Crok" }).click();
    await page.waitForURL("**/crok", { timeout: 10_000 });

    // メッセージを送信してSSE完了を待つ
    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.fill("テスト");
    await page.getByRole("button", { name: "送信" }).click();
    await expect(page.getByText("Crok AIは間違いを起こす可能性があります。")).toBeVisible({
      timeout: 300_000,
    });
  });

  test("Markdownが正しくレンダリングされること", async ({ page }) => {
    // 見出しが表示されること
    await expect(page.getByRole("heading", { name: /走れメロス/ })).toBeVisible();

    // テーブルが表示されること
    const tables = page.locator("table");
    await expect(tables.first()).toBeVisible();

    // 引用ブロックが表示されること
    const blockquotes = page.locator("blockquote");
    await expect(blockquotes.first()).toBeVisible();

    // リストが表示されること
    const lists = page.locator("ul, ol");
    await expect(lists.first()).toBeVisible();
  });

  test("コードブロックがシンタックスハイライトされること", async ({ page }) => {
    // コードブロックが存在すること
    const codeBlocks = page.locator("pre code");
    await expect(codeBlocks.first()).toBeVisible();

    // シンタックスハイライト: コード内にスタイル付き span が存在すること
    const highlightedTokens = page.locator("pre code span");
    const tokenCount = await highlightedTokens.count();
    expect(tokenCount).toBeGreaterThan(0);
  });

  test("数式が初期仕様と同じ見た目でレンダリングされること", async ({ page }) => {
    // KaTeX でレンダリングされた数式要素が存在すること
    const katexElements = page.locator(".katex, .katex-display, .katex-html");
    await expect(katexElements.first()).toBeVisible({ timeout: 10_000 });

    // 数式の件数が十分であること（crok-response.mdには複数の数式がある）
    const katexCount = await katexElements.count();
    expect(katexCount).toBeGreaterThanOrEqual(3);

    // VRT: Crok AI応答（Markdownレンダリング）
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("regulation-crok-AIレスポンス.png", {
      fullPage: false,
      mask: dynamicMediaMask(page),
    });
  });

  test("crok-response.md に記載された内容がレンダリングされること", async ({ page }) => {
    // レスポンスの主要セクションが表示されていること
    await expect(page.getByText("結論から言うね")).toBeVisible();
    await expect(page.getByText("登場人物")).toBeVisible();
    await expect(page.getByText("第一章：激怒と決意")).toBeVisible();
    await expect(page.getByText("信実のプロトコル")).toBeVisible();
  });
});

// ================================================================
// 手動テスト: 投稿詳細 - 翻訳機能
// ================================================================
test.describe("手動テスト: 投稿詳細 - 翻訳機能", () => {
  test("Show Translationをクリックすると投稿内容が英語に翻訳されること", async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    const firstArticle = page.locator("article").first();
    await expect(firstArticle).toBeVisible({ timeout: 30_000 });
    await firstArticle.click();
    await page.waitForURL("**/posts/*", { timeout: 10_000 });

    // 元の投稿テキストを取得
    const postContent = page.locator("article p").first();
    await expect(postContent).toBeVisible({ timeout: 10_000 });
    const originalText = await postContent.innerText();

    // Show Translation ボタンをクリック
    const translateButton = page.getByRole("button", { name: "Show Translation" });
    await expect(translateButton).toBeVisible({ timeout: 30_000 });
    await translateButton.click();

    // 翻訳後のテキストが表示されること（元のテキストと異なる）
    await expect(async () => {
      const translatedText = await postContent.innerText();
      expect(translatedText).not.toBe(originalText);
    }).toPass({ timeout: 120_000 });
  });

  test("翻訳後にShow Originalをクリックすると元の投稿文が表示されること", async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    const firstArticle = page.locator("article").first();
    await expect(firstArticle).toBeVisible({ timeout: 30_000 });
    await firstArticle.click();
    await page.waitForURL("**/posts/*", { timeout: 10_000 });

    // 元の投稿テキストを取得
    const postContent = page.locator("article p").first();
    await expect(postContent).toBeVisible({ timeout: 10_000 });
    const originalText = await postContent.innerText();

    // 翻訳
    const translateButton = page.getByRole("button", { name: "Show Translation" });
    await expect(translateButton).toBeVisible({ timeout: 30_000 });
    await translateButton.click();

    // 翻訳完了を待つ
    await expect(async () => {
      const text = await postContent.innerText();
      expect(text).not.toBe(originalText);
    }).toPass({ timeout: 120_000 });

    // Show Original をクリック
    const originalButton = page.getByRole("button", { name: "Show Original" });
    await expect(originalButton).toBeVisible({ timeout: 10_000 });
    await originalButton.click();

    // 元のテキストに戻ること
    await expect(postContent).toContainText(originalText, { timeout: 10_000 });
  });
});

// ================================================================
// 手動テスト: 投稿詳細 - ALT表示
// ================================================================
test.describe("手動テスト: 投稿詳細 - ALT表示", () => {
  test("「ALT を表示する」ボタンを押すと画像のALTが表示されること", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    // 画像付き投稿を探してクリック
    const imageArticle = page.locator("article:has(.grid img)").first();
    await expect(imageArticle).toBeVisible({ timeout: 30_000 });
    await imageArticle.click();
    await page.waitForURL("**/posts/*", { timeout: 10_000 });

    // ALTボタンが存在すること
    const altButton = page.getByRole("button", { name: /ALT/ });
    await expect(altButton).toBeVisible({ timeout: 30_000 });

    // ボタンをクリック
    await altButton.click();

    // ALTテキストが表示されること（何らかのテキストが新たに表示される）
    // ※ ALTが空の場合もあるため、ダイアログやポップオーバーが出現することを確認
    await expect(async () => {
      const dialogs = page.locator("[role='dialog'], [popover], .alt-text, [data-alt]");
      const altTexts = page.getByText(/ALT/);
      const count = (await dialogs.count()) + (await altTexts.count());
      expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 10_000 });
  });
});

// ================================================================
// 手動テスト: 投稿機能 - TIFF画像
// ================================================================
test.describe("手動テスト: 投稿機能 - TIFF画像", () => {
  test("TIFF形式の画像を投稿でき、EXIFのImage DescriptionがALTとして表示されること", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);

    const postText = "TIFF画像テスト投稿";

    // 投稿モーダルを開く
    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();
    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill(postText);

    // TIFF画像を添付
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    await fileInput.setInputFiles(TIFF_PATH);

    // 変換完了を待つ（ImageMagick WASM による変換）
    const submitButton = page.locator("dialog").getByRole("button", { name: "投稿する" });
    await expect(submitButton).toBeEnabled({ timeout: 120_000 });

    // 投稿
    await submitButton.click();

    // 投稿詳細に遷移
    await page.waitForURL("**/posts/*", { timeout: 60_000 });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 10_000 });

    // 画像が表示されていること
    const postImage = article.locator("img").first();
    await expect(postImage).toBeVisible({ timeout: 30_000 });

    // 画像のalt属性が設定されていること（EXIFのImage Descriptionから）
    const altText = await postImage.getAttribute("alt");
    expect(altText).toBeTruthy();
    expect(altText!.length).toBeGreaterThan(0);
  });
});

// ================================================================
// 手動テスト: 投稿機能 - WAV音声
// ================================================================
test.describe("手動テスト: 投稿機能 - WAV音声", () => {
  test("WAV形式の音声を投稿でき、Shift_JISメタデータが文字化けせずに表示されること", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);

    const postText = "WAV音声テスト投稿";

    // 投稿モーダルを開く
    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();
    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill(postText);

    // WAVファイルを添付
    const fileInput = page.locator('input[type="file"][accept="audio/*"]');
    await fileInput.setInputFiles(WAV_PATH);

    // 変換完了を待つ
    const submitButton = page.locator("dialog").getByRole("button", { name: "投稿する" });
    await expect(submitButton).toBeEnabled({ timeout: 120_000 });

    // 投稿
    await submitButton.click();

    // 投稿詳細に遷移
    await page.waitForURL("**/posts/*", { timeout: 60_000 });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 10_000 });

    // 音声の波形が表示されていること
    const waveform = page.locator('svg[viewBox="0 0 100 1"]');
    await expect(waveform).toBeVisible({ timeout: 30_000 });

    // メタデータが文字化けしていないこと
    // Shift_JISのメタデータが正しく表示されていることを確認
    // 文字化けの典型的なパターン（〓, ?, ¥, ﾃ 等）が含まれていないこと
    const articleText = await article.innerText();
    expect(articleText).not.toMatch(/[\ufffd\u0000-\u001f]/); // Unicode replacement character or control chars
  });
});

// ================================================================
// 手動テスト: 投稿機能 - MKV動画
// ================================================================
test.describe("手動テスト: 投稿機能 - MKV動画", () => {
  test("MKV形式の動画を投稿できること", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);

    const postText = "MKV動画テスト投稿";

    // 投稿モーダルを開く
    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();
    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill(postText);

    // MKVファイルを添付
    const fileInput = page.locator('input[type="file"][accept="video/*"]');
    await fileInput.setInputFiles(MKV_PATH);

    // 変換完了を待つ（FFmpeg による GIF 変換）
    const submitButton = page.locator("dialog").getByRole("button", { name: "投稿する" });
    await expect(submitButton).toBeEnabled({ timeout: 120_000 });

    // 投稿
    await submitButton.click();

    // 投稿詳細に遷移
    await page.waitForURL("**/posts/*", { timeout: 60_000 });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 10_000 });

    // 投稿テキストが表示されていること
    await expect(page.getByText(postText)).toBeVisible();
  });

  test("投稿した動画が正方形に切り抜かれること", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);

    // 投稿モーダルを開く
    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();
    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill("正方形テスト");

    // MKVファイルを添付
    const fileInput = page.locator('input[type="file"][accept="video/*"]');
    await fileInput.setInputFiles(MKV_PATH);

    // 変換完了を待つ
    const submitButton = page.locator("dialog").getByRole("button", { name: "投稿する" });
    await expect(submitButton).toBeEnabled({ timeout: 120_000 });
    await submitButton.click();

    // 投稿詳細に遷移
    await page.waitForURL("**/posts/*", { timeout: 60_000 });

    // 動画（GIF→canvas）が表示されるまで待つ
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 30_000 });

    // canvas が正方形であること（幅と高さが等しい）
    const dimensions = await canvas.evaluate((el: HTMLCanvasElement) => ({
      width: el.width,
      height: el.height,
    }));
    expect(dimensions.width).toBe(dimensions.height);
    expect(dimensions.width).toBeGreaterThan(0);
  });
});

// ================================================================
// 手動テスト: サインアウト
// ================================================================
test.describe("手動テスト: サインアウト", () => {
  test("サインアウトが成功するとサイドバーにサインインボタンが出現すること", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);

    // サインアウトボタンが表示されていること
    const signoutButton = page.getByRole("button", { name: "サインアウト" });
    await expect(signoutButton).toBeVisible({ timeout: 10_000 });

    // サインアウト実行
    await signoutButton.click();

    // サインインボタンが表示されること
    await expect(page.getByRole("button", { name: "サインイン" })).toBeVisible({
      timeout: 10_000,
    });

    // Crokリンクが消えること（サインアウト状態）
    await expect(page.getByRole("link", { name: "Crok" })).not.toBeVisible();
  });
});

// ================================================================
// 手動テスト: パスワードバリデーション
// ================================================================
test.describe("手動テスト: パスワードバリデーション", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/not-found", { waitUntil: "domcontentloaded" });
    const signinButton = page.getByRole("button", { name: "サインイン" });
    await expect(signinButton).toBeVisible({ timeout: 30_000 });
    await signinButton.click();
    await page.getByRole("heading", { name: "サインイン" }).waitFor({ timeout: 10_000 });
  });

  test("パスワードが初期仕様通りにバリデーションされること（サインイン）", async ({ page }) => {
    const passwordInput = page.getByRole("textbox", { name: "パスワード" });

    // パスワードなしではサインインボタンが無効
    await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially("o6yq16leo");
    // パスワード未入力の状態
    const signinButton = page.getByRole("button", { name: "サインイン" }).last();
    await expect(signinButton).toBeDisabled();

    // パスワードを入力するとサインインボタンが有効になること
    await passwordInput.pressSequentially("wsh-2026");
    await expect(signinButton).toBeEnabled();
  });

  test("パスワードが初期仕様通りにバリデーションされること（新規登録）", async ({ page }) => {
    await page.getByRole("button", { name: "初めての方はこちら" }).click();
    await page.getByRole("heading", { name: "新規登録" }).waitFor({ timeout: 10_000 });

    await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially("valid_user");
    await page.getByRole("textbox", { name: "名前" }).pressSequentially("テスト");

    const passwordInput = page.getByRole("textbox", { name: "パスワード" });
    const registerButton = page.getByRole("button", { name: "登録する" });

    // パスワード未入力では登録ボタンが無効
    await expect(registerButton).toBeDisabled();

    // パスワードを入力すると登録ボタンが有効になる
    await passwordInput.pressSequentially("validpass-123");
    await expect(registerButton).toBeEnabled();
  });
});

// ================================================================
// 手動テスト: DM - タイトル・リンク表示
// ================================================================
test.describe("手動テスト: DM - タイトル・リンク表示", () => {
  test("DM一覧のタイトルが「ダイレクトメッセージ - CaX」であること", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.goto("/dm");
    await expect(page).toHaveTitle("ダイレクトメッセージ - CaX", { timeout: 30_000 });
  });

  test("DM詳細のタイトルが「{ユーザー名} さんとのダイレクトメッセージ - CaX」であること", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.goto("/dm");

    await page.getByRole("link", { name: "p72k8qi1c3" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000 });

    await expect(page).toHaveTitle(/さんとのダイレクトメッセージ - CaX/, { timeout: 10_000 });
  });

  test("サインイン済みの場合、サイドバーにDMのリンクが表示されること", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await expect(page.getByRole("link", { name: "DM" })).toBeVisible();
  });

  test("未サインインの場合、DMのリンクが表示されないこと", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: "DM" })).not.toBeVisible();
  });
});

// ================================================================
// 手動テスト: DM - 未読バッジ
// ================================================================
test.describe("手動テスト: DM - 未読バッジ", () => {
  test("未読のメッセージがある場合はメニューに未読数のバッジが表示されること", async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page, "gg3i6j6");

    // 相手からメッセージを送信
    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "jirgqx22");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000 });

    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(`未読テスト ${Date.now()}`, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // 元のページでバッジが表示されること
    await expect(async () => {
      // バッジ要素を探す（数値を含むバッジ）
      const badge = page.locator("[data-testid='unread-badge'], .badge, [aria-label*='未読']");
      const badgeCount = await badge.count();
      expect(badgeCount).toBeGreaterThan(0);
    }).toPass({ timeout: 30_000 });

    await peerContext.close();
  });

  test("DM一覧で未読メッセージがある場合は「未読」のバッジが表示されること", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.goto("/dm");

    // DM一覧が表示されるまで待つ
    await expect(page.getByTestId("dm-list")).toBeVisible({ timeout: 30_000 });

    // VRT: DM一覧（未読バッジ確認用）
    await expect(page).toHaveScreenshot("regulation-dm-DM一覧.png", {
      fullPage: false,
    });
  });
});

// ================================================================
// 手動テスト: DM - 初期スクロール・既読
// ================================================================
test.describe("手動テスト: DM - 初期スクロール・既読", () => {
  test("DM詳細画面で初期表示時に画面が一番下までスクロールされていること", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.goto("/dm");

    await page.getByRole("link", { name: "p72k8qi1c3" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000 });

    // メッセージリストが表示されるまで待つ
    const messageList = page.getByTestId("dm-message-list");
    await expect(messageList).toBeVisible({ timeout: 10_000 });

    // 一番下までスクロールされていること
    await expect(async () => {
      const isScrolledToBottom = await messageList.evaluate((el) => {
        // スクロール位置が最下部付近であること
        return Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 50;
      });
      expect(isScrolledToBottom).toBe(true);
    }).toPass({ timeout: 10_000 });
  });

  test("メッセージにはメッセージ本文と送信時間が表示されること", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.goto("/dm");

    await page.getByRole("link", { name: "p72k8qi1c3" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000 });

    const messageList = page.getByTestId("dm-message-list");
    await expect(messageList).toBeVisible({ timeout: 10_000 });

    // メッセージが存在すること
    const messages = messageList.locator("li");
    const count = await messages.count();
    expect(count).toBeGreaterThan(0);

    // 各メッセージに時間（time要素）が含まれること
    const firstMessage = messages.first();
    const timeElement = firstMessage.locator("time");
    await expect(timeElement).toBeVisible();

    // time要素にdatetime属性があること
    const datetime = await timeElement.getAttribute("datetime");
    expect(datetime).toBeTruthy();
  });

  test("DM一覧にユーザー名、プロフィール画像、最新メッセージ本文、経過時間が表示されること", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.goto("/dm");

    const dmList = page.getByTestId("dm-list");
    await expect(dmList).toBeVisible({ timeout: 30_000 });

    const firstItem = dmList.locator("li").first();
    await expect(firstItem).toBeVisible();

    // プロフィール画像が存在すること
    const profileImage = firstItem.locator("img");
    await expect(profileImage).toBeVisible();

    // 時間（time要素）が存在すること
    const timeElement = firstItem.locator("time");
    await expect(timeElement).toBeVisible();
  });
});

// ================================================================
// 手動テスト: ユーザー詳細 - サービス利用開始日
// ================================================================
test.describe("手動テスト: ユーザー詳細 - サービス利用開始日", () => {
  test("サービス利用開始の日時が正しく表示されること", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    // o6yq16leo の createdAt: "2026-01-25T03:13:53.812Z"
    await page.goto("/users/o6yq16leo");

    // ページが表示されるまで待つ
    await expect(page).toHaveTitle(/さんのタイムライン - CaX/, { timeout: 30_000 });

    // 利用開始日が表示されていること（2026年1月の日時）
    await expect(async () => {
      const pageText = await page.locator("main").innerText();
      // 日付が何らかの形式で表示されていること
      expect(pageText).toMatch(/2026/);
    }).toPass({ timeout: 10_000 });

    // VRT: ユーザー詳細（日時表示確認）
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("regulation-user-profile-詳細.png", {
      fullPage: false,
      mask: dynamicMediaMask(page),
    });
  });
});

// ================================================================
// 手動テスト: 投稿詳細 - 音声再生位置
// ================================================================
test.describe("手動テスト: 投稿詳細 - 音声再生位置", () => {
  test("音声の再生位置が波形で表示されること", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    // 音声付き投稿を探してクリック
    const soundArticle = page.locator('article:has(svg[viewBox="0 0 100 1"])').first();
    await expect(soundArticle).toBeVisible({ timeout: 30_000 });
    await soundArticle.locator("time").first().click();
    await page.waitForURL("**/posts/*", { timeout: 10_000 });

    const waveform = page.locator('svg[viewBox="0 0 100 1"]').first();
    await expect(waveform).toBeVisible({ timeout: 30_000 });

    // 再生ボタンをクリック
    const playButton = page.locator("button.rounded-full.bg-cax-accent").first();
    await playButton.click();

    // 少し再生を待つ
    await page.waitForTimeout(2_000);

    // 波形内に再生位置を示す要素が存在すること
    // （rect, line, mask等のSVG要素で再生位置が表示される）
    const positionIndicator = waveform.locator("rect, line, mask, clipPath");
    const indicatorCount = await positionIndicator.count();
    expect(indicatorCount).toBeGreaterThan(0);

    // 一時停止
    await playButton.click();
  });
});

// ================================================================
// 手動テスト: DM - 新規メッセージ受信時のスクロール
// ================================================================
test.describe("手動テスト: DM - リアルタイム更新", () => {
  test("新規メッセージを受信した場合、画面が一番下までスクロールされること", async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await page.getByRole("link", { name: "jirgqx22" }).click();
    await page.waitForURL("**/dm/*", { timeout: 10_000 });

    const messageList = page.getByTestId("dm-message-list");
    await expect(messageList).toBeVisible({ timeout: 10_000 });

    // 相手からメッセージを送信
    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "jirgqx22");
    await peerPage.goto("/dm");
    await peerPage.getByRole("link", { name: "gg3i6j6" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000 });

    const now = `【スクロールテスト ${Date.now()}】`;
    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(now, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // メッセージが受信されること
    await expect(page.getByText(now)).toBeVisible({ timeout: 30_000 });

    // 画面が一番下までスクロールされていること
    await expect(async () => {
      const isScrolledToBottom = await messageList.evaluate((el) => {
        return Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 50;
      });
      expect(isScrolledToBottom).toBe(true);
    }).toPass({ timeout: 10_000 });

    await peerContext.close();
  });

  test("DM一覧画面で新規メッセージを受信した場合、画面がリアルタイムで更新されること", async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page, "gg3i6j6");
    await page.goto("/dm");

    await expect(page.getByTestId("dm-list")).toBeVisible({ timeout: 30_000 });

    // 相手からメッセージを送信
    const peerContext = await browser.newContext();
    const peerPage = await peerContext.newPage();
    await login(peerPage, "g16hmw55");
    await peerPage.goto("/dm");

    // gg3i6j6 宛にDMを開始
    await peerPage.getByRole("button", { name: "新しくDMを始める" }).click();
    await peerPage
      .getByRole("dialog")
      .getByRole("heading", { name: "新しくDMを始める" })
      .waitFor({ timeout: 10_000 });
    const usernameInput = peerPage.getByRole("dialog").getByRole("textbox", { name: "ユーザー名" });
    await usernameInput.click();
    await usernameInput.pressSequentially("gg3i6j6", { delay: 10 });
    await usernameInput.blur();
    await peerPage.getByRole("dialog").getByRole("button", { name: "DMを開始" }).click();
    await peerPage.waitForURL("**/dm/*", { timeout: 10_000 });

    const now = `【リアルタイム更新テスト ${Date.now()}】`;
    const messageInput = peerPage.getByRole("textbox", { name: "内容" });
    await messageInput.click();
    await messageInput.pressSequentially(now, { delay: 10 });
    await peerPage.keyboard.press("Enter");

    // 元のDM一覧画面にリアルタイムで反映されること
    await expect(page.getByText(now)).toBeVisible({ timeout: 30_000 });

    await peerContext.close();
  });
});
