import type * as playwright from "playwright";

const DEFAULT_USERNAME = "o6yq16leo";
const DEFAULT_PASSWORD = "wsh-2026";

type Params = {
  page: playwright.Page;
  username?: string;
  password?: string;
};

export async function signInWithDefaultUser({
  page,
  username = DEFAULT_USERNAME,
  password = DEFAULT_PASSWORD,
}: Params): Promise<void> {
  const openSignInButton = page.getByRole("button", { name: "サインイン" }).first();
  await openSignInButton.waitFor({ state: "visible", timeout: 15 * 1000 });
  await openSignInButton.click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("ユーザー名").waitFor({ state: "visible", timeout: 15 * 1000 });

  await dialog.getByLabel("ユーザー名").fill(username);
  await dialog.getByLabel("パスワード").fill(password);

  await dialog.getByRole("button", { name: "サインイン" }).last().click();
  await page.getByRole("link", { name: "マイページ" }).waitFor({ timeout: 20 * 1000 });
}
