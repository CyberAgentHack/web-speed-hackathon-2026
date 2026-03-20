import { expect, test } from "@playwright/test";

test.describe("サインイン・新規登録", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/not-found", { waitUntil: "domcontentloaded" });
    const signinButton = page.getByRole("button", { name: "サインイン" });
    await expect(signinButton).toBeVisible({ timeout: 30_000 });
    await signinButton.click();
    await page.getByRole("heading", { name: "サインイン" }).waitFor({ timeout: 10_000 });
  });

  test("新規登録ができる", async ({ page }) => {
    await page.getByRole("button", { name: "初めての方はこちら" }).click();
    await page.getByRole("heading", { name: "新規登録" }).waitFor({ timeout: 10_000 });

    const username = `test_${Date.now().toString(36)}`;

    await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially(username);
    await page.getByRole("textbox", { name: "名前" }).pressSequentially("テストユーザー");
    await page.getByRole("textbox", { name: "パスワード" }).pressSequentially("testpass-123");

    await page.getByRole("button", { name: "登録する" }).click();

    // サインイン状態になる
    await page.getByRole("link", { name: "マイページ" }).waitFor({ timeout: 10_000 });
    await page.getByRole("link", { name: "Crok" }).waitFor({ timeout: 10_000 });

    await page.getByRole("link", { name: "マイページ" }).click();
    await page.getByRole("heading", { name: "テストユーザー" }).waitFor({ timeout: 10_000 });
  });

  test("日本語ユーザー名で登録するとエラーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "初めての方はこちら" }).click();
    await page.getByRole("heading", { name: "新規登録" }).waitFor({ timeout: 10_000 });

    await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially("テストユーザー");
    await page.getByRole("textbox", { name: "名前" }).pressSequentially("テスト");
    await page.getByRole("textbox", { name: "パスワード" }).pressSequentially("testpass-123");

    // エラーメッセージが表示される
    await expect(
      page.getByText("ユーザー名に使用できるのは英数字とアンダースコア(_)のみです"),
    ).toBeVisible({
      timeout: 10_000,
    });
  });

  test("既に使われているユーザー名で登録するとエラーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "初めての方はこちら" }).click();
    await page.getByRole("heading", { name: "新規登録" }).waitFor({ timeout: 10_000 });

    // 既存ユーザー名を使用
    await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially("o6yq16leo");
    await page.getByRole("textbox", { name: "名前" }).pressSequentially("テスト");
    await page.getByRole("textbox", { name: "パスワード" }).pressSequentially("testpass-123");

    await page.getByRole("button", { name: "登録する" }).click();

    // エラーメッセージが表示される
    await expect(page.getByText("ユーザー名が使われています")).toBeVisible({ timeout: 10_000 });
  });

  test("未入力の場合はボタンが無効化されている", async ({ page }) => {
    await page.getByRole("button", { name: "初めての方はこちら" }).click();
    await page.getByRole("heading", { name: "新規登録" }).waitFor({ timeout: 10_000 });

    // 何も入力しない状態で登録ボタンが無効
    await expect(page.getByRole("button", { name: "登録する" })).toBeDisabled();

    // ユーザー名だけ入力してもまだ無効
    await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially("test_user");
    await expect(page.getByRole("button", { name: "登録する" })).toBeDisabled();

    // 名前も入力してもまだ無効
    await page.getByRole("textbox", { name: "名前" }).pressSequentially("テスト");
    await expect(page.getByRole("button", { name: "登録する" })).toBeDisabled();

    // パスワードも入力すると有効になる
    await page.getByRole("textbox", { name: "パスワード" }).pressSequentially("testpass-123");
    await expect(page.getByRole("button", { name: "登録する" })).toBeEnabled();
  });

  test("サインインに失敗するとエラーが表示される", async ({ page }) => {
    await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially("o6yq16leo");
    await page.getByRole("textbox", { name: "パスワード" }).pressSequentially("wrong_password");

    await page.getByRole("button", { name: "サインイン" }).last().click();

    // エラーメッセージが表示される
    await expect(page.getByText("パスワードが異なります")).toBeVisible({ timeout: 10_000 });
  });
});
