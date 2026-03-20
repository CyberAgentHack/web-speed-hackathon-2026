import { expect, test } from "@playwright/test";

test.describe("サインイン・新規登録", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/not-found", { waitUntil: "networkidle" });
    const signinButton = page.getByRole("button", { name: "サインイン" });
    await expect(signinButton).toBeVisible({ timeout: 3_000 });
    await signinButton.click();
    await page.getByRole("heading", { name: "サインイン" }).waitFor({ timeout: 3_000 });
  });

  test("サインインモーダルが表示される", async ({ page }) => {
    // VRT: サインインモーダル初期状態
    await expect(page).toHaveScreenshot("auth-サインインモーダル.png");
  });

  test("新規登録モーダルが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "初めての方はこちら" }).click();
    await page.getByRole("heading", { name: "新規登録" }).waitFor({ timeout: 3_000 });

    // VRT: 新規登録モーダル初期状態
    await expect(page).toHaveScreenshot("auth-新規登録モーダル.png");
  });

  test("新規登録ができ、サインアウトボタンが出現する", async ({ page }) => {
    await page.getByRole("button", { name: "初めての方はこちら" }).click();
    await page.getByRole("heading", { name: "新規登録" }).waitFor({ timeout: 3_000 });

    const username = `test_${Date.now().toString(36)}`;

    await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially(username);
    await page.getByRole("textbox", { name: "名前" }).pressSequentially("テストユーザー");
    await page.getByRole("textbox", { name: "パスワード" }).pressSequentially("testpass-123");

    await page.getByRole("button", { name: "登録する" }).click();

    // サインイン状態になる（モーダルが閉じ、Crokリンクが表示される）
    await page.getByRole("link", { name: "Crok" }).waitFor({ timeout: 3_000 });

    // サイドバーにアカウントメニュー（サインアウトを含む）が出現すること
    const accountMenuButton = page.getByRole("button", { name: "アカウントメニュー" });
    await expect(accountMenuButton).toBeVisible({ timeout: 3_000 });
    await accountMenuButton.click();
    await expect(page.getByRole("button", { name: "サインアウト" })).toBeVisible({
      timeout: 3_000,
    });
  });

  test.describe("新規登録バリデーション", () => {
    test("ユーザー名バリデーション - 日本語でエラー", async ({ page }) => {
      await page.getByRole("button", { name: "初めての方はこちら" }).click();
      await page.getByRole("heading", { name: "新規登録" }).waitFor({ timeout: 3_000 });

      await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially("テストユーザー");
      await page.getByRole("textbox", { name: "名前" }).pressSequentially("テスト");
      await page.getByRole("textbox", { name: "パスワード" }).pressSequentially("testpass-123");

      await expect(
        page.getByText("ユーザー名に使用できるのは英数字とアンダースコア(_)のみです"),
      ).toBeVisible({
        timeout: 3_000,
      });

      // VRT: バリデーションエラー状態
      await expect(page).toHaveScreenshot("auth-新規登録バリデーションエラー.png");
    });

    test("パスワードバリデーション - 記号なしでエラー", async ({ page }) => {
      await page.getByRole("button", { name: "初めての方はこちら" }).click();
      await page.getByRole("heading", { name: "新規登録" }).waitFor({ timeout: 3_000 });

      await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially("validuser");
      await page.getByRole("textbox", { name: "名前" }).pressSequentially("テスト");
      // 16文字以上の英数字のみパスワード（記号なし）
      await page.getByRole("textbox", { name: "パスワード" }).pressSequentially("abcdefghijklmnop");
      await page.getByRole("textbox", { name: "パスワード" }).blur();

      // パスワードバリデーションエラーが表示される
      // 登録ボタンが無効化されていることで検証
      await expect(page.getByRole("button", { name: "登録する" })).toBeDisabled();
    });

    test("未入力の場合はボタンが無効化されている", async ({ page }) => {
      await page.getByRole("button", { name: "初めての方はこちら" }).click();
      await page.getByRole("heading", { name: "新規登録" }).waitFor({ timeout: 3_000 });

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
  });

  test("既に使われているユーザー名で登録するとエラーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "初めての方はこちら" }).click();
    await page.getByRole("heading", { name: "新規登録" }).waitFor({ timeout: 3_000 });

    // 既存ユーザー名を使用
    await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially("o6yq16leo");
    await page.getByRole("textbox", { name: "名前" }).pressSequentially("テスト");
    await page.getByRole("textbox", { name: "パスワード" }).pressSequentially("testpass-123");

    await page.getByRole("button", { name: "登録する" }).click();

    // エラーメッセージが表示される
    await expect(page.getByText("ユーザー名が使われています")).toBeVisible({ timeout: 3_000 });

    // VRT: サーバーエラー状態
    await expect(page).toHaveScreenshot("auth-ユーザー名重複エラー.png");
  });

  test.describe("サインイン", () => {
    test("サインインバリデーション - 未入力でボタン無効", async ({ page }) => {
      // サインインモーダルで送信ボタンの状態を確認
      const submitButton = page.getByRole("button", { name: "サインイン" }).last();

      // 何も入力しない状態
      await expect(submitButton).toBeDisabled();

      // ユーザー名のみ入力
      await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially("o6yq16leo");
      await expect(submitButton).toBeDisabled();

      // パスワードも入力すると有効
      await page.getByRole("textbox", { name: "パスワード" }).pressSequentially("wsh-2026");
      await expect(submitButton).toBeEnabled();
    });

    test("サインイン成功でモーダルが閉じ、サインアウトボタンが出現する", async ({ page }) => {
      await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially("o6yq16leo");
      await page.getByRole("textbox", { name: "パスワード" }).pressSequentially("wsh-2026");

      await page.getByRole("button", { name: "サインイン" }).last().click();

      // モーダルが閉じる（Crokリンクが表示される = サインイン状態）
      await page.getByRole("link", { name: "Crok" }).waitFor({ timeout: 3_000 });

      // サインインモーダルが閉じていること
      await expect(page.getByRole("heading", { name: "サインイン" })).not.toBeVisible();

      // サイドバーにアカウントメニューが表示される
      const accountMenuButton = page.getByRole("button", { name: "アカウントメニュー" });
      await expect(accountMenuButton).toBeVisible({ timeout: 3_000 });
      await accountMenuButton.click();
      await expect(page.getByRole("button", { name: "サインアウト" })).toBeVisible({
        timeout: 3_000,
      });
    });

    test("サインインに失敗するとエラーが表示される", async ({ page }) => {
      await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially("o6yq16leo");
      await page.getByRole("textbox", { name: "パスワード" }).pressSequentially("wrong_password");

      await page.getByRole("button", { name: "サインイン" }).last().click();

      // エラーメッセージが表示される
      await expect(page.getByText("パスワードが異なります")).toBeVisible({ timeout: 3_000 });

      // VRT: サインイン失敗エラー状態
      await expect(page).toHaveScreenshot("auth-サインイン失敗エラー.png");
    });
  });

  test.describe("サインアウト", () => {
    test("サインアウトするとサインインボタンが出現する", async ({ page }) => {
      // まずサインインする
      await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially("o6yq16leo");
      await page.getByRole("textbox", { name: "パスワード" }).pressSequentially("wsh-2026");
      await page.getByRole("button", { name: "サインイン" }).last().click();
      await page.getByRole("link", { name: "Crok" }).waitFor({ timeout: 3_000 });

      // アカウントメニューからサインアウト
      const accountMenuButton = page.getByRole("button", { name: "アカウントメニュー" });
      await expect(accountMenuButton).toBeVisible({ timeout: 3_000 });
      await accountMenuButton.click();
      await page.getByRole("button", { name: "サインアウト" }).click();

      // サインアウト後、サインインボタンが出現すること
      await expect(page.getByRole("button", { name: "サインイン" })).toBeVisible({
        timeout: 10_000,
      });

      // Crokリンクが消えていること（未サインイン状態）
      await expect(page.getByRole("link", { name: "Crok" })).not.toBeVisible();
    });
  });
});
