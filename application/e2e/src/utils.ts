import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

export async function login(
  page: Page,
  username: string = "o6yq16leo",
  password: string = "wsh-2026",
): Promise<void> {
  await page.goto("/not-found", { waitUntil: "domcontentloaded" });
  const signinButton = page.getByRole("button", { name: "サインイン" });
  await expect(signinButton).toBeVisible({ timeout: 30_000 });
  await signinButton.click();
  await page.getByRole("heading", { name: "サインイン" }).waitFor({ timeout: 30_000 });
  await page.getByRole("textbox", { name: "ユーザー名" }).pressSequentially(username);
  await page.getByRole("textbox", { name: "パスワード" }).pressSequentially(password);
  await page.getByRole("button", { name: "サインイン" }).last().click();
  await page.getByRole("link", { name: "Crok" }).waitFor({ timeout: 30_000 });
}

/** ビューポート内の全メディア（img/movie/sound）が読み込み完了するまで待つ */
export async function waitForVisibleMedia(page: Page): Promise<void> {
  await expect(async () => {
    const allLoaded = await page.evaluate(() => {
      const vh = window.innerHeight;

      function isInViewport(el: Element): boolean {
        const rect = el.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < vh;
      }

      const imgs = Array.from(document.querySelectorAll("main img")).filter(isInViewport);

      const imgsOk = imgs.every(
        (img) =>
          (img as HTMLImageElement).naturalWidth > 0 && (img as HTMLImageElement).naturalHeight > 0,
      );

      // ビューポート内の動画コンテナに canvas または video が出現しているか
      const movieAreas = Array.from(document.querySelectorAll("main [data-movie-area]")).filter(
        isInViewport,
      );
      const moviesReady = movieAreas.every((area) => {
        const canvas = area.querySelector("canvas");
        const video = area.querySelector("video");
        if (canvas) return canvas.width > 0 && canvas.height > 0;
        if (video) return (video as HTMLVideoElement).readyState >= 1;
        return false;
      });

      // ビューポート内の音声コンテナに svg（波形）が出現しているか
      const soundAreas = Array.from(document.querySelectorAll("main [data-sound-area]")).filter(
        isInViewport,
      );
      const soundsReady = soundAreas.every((area) => area.querySelector("svg") !== null);

      return imgsOk && moviesReady && soundsReady;
    });
    expect(allLoaded).toBe(true);
  }).toPass({ timeout: 60_000 });
}

/** GIF動画をマスク（フレームが毎回変わるため） */
export function dynamicMediaMask(page: Page) {
  return [page.locator("canvas"), page.locator("video"), page.locator("img[src$='.gif']")];
}

export async function waitForImageToLoad(imageLocator: Locator): Promise<void> {
  await imageLocator.scrollIntoViewIfNeeded();
  await expect(imageLocator).toBeVisible();
  await expect(async () => {
    expect(
      await (
        await imageLocator.evaluateHandle((element, prop) => {
          if (!(element instanceof HTMLImageElement)) {
            throw new Error("Element is not an image");
          }
          return element[prop as keyof typeof element];
        }, "naturalWidth")
      ).jsonValue(),
    ).toBeGreaterThan(0);
  }).toPass();
}

export async function waitForAllImagesToLoad(
  locator: Locator,
  expectedNumberOfImages: number = 1,
): Promise<void> {
  const images = locator.locator("img");

  await expect(async () => {
    await locator.scrollIntoViewIfNeeded();
    await expect(locator).toBeVisible();
    await expect(images.count()).resolves.toBeGreaterThanOrEqual(expectedNumberOfImages);
  }).toPass();

  const count = await images.count();
  for (let i = 0; i < count; i++) {
    await waitForImageToLoad(images.nth(i));
  }
}

export async function scrollEntire(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    for (let i = 0; i < document.body.scrollHeight; i += 100) {
      window.scrollTo(0, i);
      await delay(50);
    }
    for (let i = document.body.scrollHeight; i > 0; i -= 100) {
      window.scrollTo(0, i);
      await delay(50);
    }
  });
}
