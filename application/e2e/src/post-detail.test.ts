import { expect, test } from "@playwright/test";

import { dynamicMediaMask, waitForVisibleMedia } from "./utils";

test.describe("投稿詳細", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("投稿が表示される", async ({ page }) => {
    await page.goto("/");
    const firstArticle = page.locator("article").first();
    await expect(firstArticle).toBeVisible({ timeout: 3_000 });
    await firstArticle.click();
    await page.waitForURL("**/posts/*", { timeout: 10_000, waitUntil: "commit" });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 3_000 });

    // VRT: 投稿詳細
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("post-detail-投稿詳細.png", {
      mask: dynamicMediaMask(page),
    });
  });

  test("タイトルが「{ユーザー名} さんのつぶやき - CaX」", async ({ page }) => {
    await page.goto("/");
    const firstArticle = page.locator("article").first();
    await expect(firstArticle).toBeVisible({ timeout: 3_000 });
    await firstArticle.click();
    await page.waitForURL("**/posts/*", { timeout: 10_000, waitUntil: "commit" });

    await expect(page).toHaveTitle(/さんのつぶやき - CaX/, { timeout: 3_000 });
  });

  test("Show Translation をクリックすると翻訳され、Show Original で元に戻る", async ({ page }) => {
    await page.goto("/");
    const firstArticle = page.locator("article").first();
    await expect(firstArticle).toBeVisible({ timeout: 3_000 });
    await firstArticle.click();
    await page.waitForURL("**/posts/*", { timeout: 10_000, waitUntil: "commit" });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 3_000 });

    // 元のテキストを記録
    const originalText = await article.locator("p > span").first().innerText();

    // Show Translation をクリック
    const translateButton = page.getByRole("button", { name: "Show Translation" });
    await expect(translateButton).toBeVisible({ timeout: 3_000 });
    await translateButton.click();

    // 翻訳中の表示を確認（Translating... が一時的に表示される）
    // 翻訳完了を待つ（Show Original ボタンが出現する）
    const showOriginalButton = page.getByRole("button", { name: "Show Original" });
    await expect(showOriginalButton).toBeVisible({ timeout: 30_000 });

    // 翻訳後のテキストが表示されている（元のテキストと異なるか、失敗メッセージが表示される）
    const translatedText = await article.locator("p > span").first().innerText();
    // 翻訳が成功した場合は元テキストと異なる、失敗した場合は "翻訳に失敗しました" が表示される
    expect(translatedText !== originalText || translatedText === "翻訳に失敗しました").toBe(true);

    // Show Original をクリックして元に戻す
    await showOriginalButton.click();

    // Show Translation ボタンが再び表示される
    await expect(translateButton).toBeVisible({ timeout: 3_000 });

    // 元のテキストに戻っていること
    const restoredText = await article.locator("p > span").first().innerText();
    expect(restoredText).toBe(originalText);
  });
});

test.describe("投稿詳細 - 動画", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("動画が自動再生され、クリックで一時停止・再生を切り替えられる", async ({ page }) => {
    await page.goto("/");
    const movieArticle = page.locator("article:has([data-movie-area])").first();
    await expect(movieArticle).toBeVisible({ timeout: 3_000 });
    await movieArticle.locator("time").first().click();
    await page.waitForURL("**/posts/*", { timeout: 10_000, waitUntil: "commit" });

    const movieArea = page.locator("[data-movie-area]").first();
    await expect(movieArea).toBeVisible({ timeout: 3_000 });

    // 動画が自動再生されていることを確認
    await expect(async () => {
      const video = movieArea.locator("video").first();
      const isPlaying = await video.evaluate(
        (el: HTMLVideoElement) => !el.paused && el.readyState >= 2,
      );
      expect(isPlaying).toBe(true);
    }).toPass({ timeout: 10_000 });

    // VRT: 動画再生中
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("post-detail-動画再生中.png", {
      mask: dynamicMediaMask(page),
    });

    // クリックで一時停止
    const movieButton = movieArea.locator("button").first();
    await movieButton.click();

    await expect(async () => {
      const video = movieArea.locator("video").first();
      const isPaused = await video.evaluate((el: HTMLVideoElement) => el.paused);
      expect(isPaused).toBe(true);
    }).toPass({ timeout: 3_000 });

    // 再度クリックして再生再開
    await movieButton.click();

    await expect(async () => {
      const video = movieArea.locator("video").first();
      const isPlaying = await video.evaluate((el: HTMLVideoElement) => !el.paused);
      expect(isPlaying).toBe(true);
    }).toPass({ timeout: 3_000 });
  });

  test("再生される動画が著しく劣化していないこと", async ({ page }) => {
    await page.goto("/");
    const movieArticle = page.locator("article:has([data-movie-area])").first();
    await expect(movieArticle).toBeVisible({ timeout: 3_000 });
    await movieArticle.locator("time").first().click();
    await page.waitForURL("**/posts/*", { timeout: 10_000, waitUntil: "commit" });

    const movieArea = page.locator("[data-movie-area]").first();
    await expect(movieArea).toBeVisible({ timeout: 3_000 });

    // 動画の解像度が十分であることを確認（著しい劣化がない）
    await expect(async () => {
      const video = movieArea.locator("video").first();
      const dimensions = await video.evaluate((el: HTMLVideoElement) => ({
        videoWidth: el.videoWidth,
        videoHeight: el.videoHeight,
        readyState: el.readyState,
      }));
      expect(dimensions.readyState).toBeGreaterThanOrEqual(2);
      // 動画解像度が最低100px以上あること（著しい劣化がない）
      expect(dimensions.videoWidth).toBeGreaterThan(100);
      expect(dimensions.videoHeight).toBeGreaterThan(100);
    }).toPass({ timeout: 10_000 });
  });
});

test.describe("投稿詳細 - 音声", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("音声の波形が表示され、再生ボタンで一時停止・再生を切り替えられる", async ({ page }) => {
    await page.goto("/");
    const soundArticle = page.locator('article:has(svg[viewBox="0 0 100 1"])').first();
    await expect(soundArticle).toBeVisible({ timeout: 3_000 });
    await soundArticle.locator("time").first().click();
    await page.waitForURL("**/posts/*", { timeout: 10_000, waitUntil: "commit" });

    const waveform = page.locator('svg[viewBox="0 0 100 1"]').first();
    await expect(waveform).toBeVisible({ timeout: 3_000 });

    // VRT: 音声（再生前）
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("post-detail-音声再生前.png", {
      mask: dynamicMediaMask(page),
    });

    // 再生ボタンをクリック
    const playButton = page.locator("button.rounded-full.bg-cax-accent").first();
    await playButton.click();

    // 再生が開始されたことを確認（audio要素のcurrentTimeが進む）
    await expect(async () => {
      const isPlaying = await page.evaluate(() => {
        const audio = document.querySelector("audio");
        return audio != null && !audio.paused;
      });
      expect(isPlaying).toBe(true);
    }).toPass({ timeout: 5_000 });

    // 一時停止
    await playButton.click();

    await expect(async () => {
      const isPaused = await page.evaluate(() => {
        const audio = document.querySelector("audio");
        return audio != null && audio.paused;
      });
      expect(isPaused).toBe(true);
    }).toPass({ timeout: 3_000 });
  });

  test("音声の再生位置が波形で表示されること", async ({ page }) => {
    await page.goto("/");
    const soundArticle = page.locator('article:has(svg[viewBox="0 0 100 1"])').first();
    await expect(soundArticle).toBeVisible({ timeout: 3_000 });
    await soundArticle.locator("time").first().click();
    await page.waitForURL("**/posts/*", { timeout: 10_000, waitUntil: "commit" });

    const waveform = page.locator('svg[viewBox="0 0 100 1"]').first();
    await expect(waveform).toBeVisible({ timeout: 3_000 });

    // 再生前の波形の状態を確認
    const rectsBefore = await waveform.locator("rect").count();
    expect(rectsBefore).toBeGreaterThan(0);

    // 再生ボタンをクリック
    const playButton = page.locator("button.rounded-full.bg-cax-accent").first();
    await playButton.click();

    // 少し再生した後、再生位置が波形上で視覚的に示されていることを確認
    // （波形のrect要素の色/fillが変化していること）
    await expect(async () => {
      const hasProgress = await waveform.evaluate((svg) => {
        const rects = svg.querySelectorAll("rect");
        const fills = new Set<string>();
        rects.forEach((rect) => {
          const fill = rect.getAttribute("fill") || window.getComputedStyle(rect).fill;
          fills.add(fill);
        });
        // 再生中は再生済み部分と未再生部分で色が異なるため、2種類以上のfillがある
        return fills.size >= 2;
      });
      expect(hasProgress).toBe(true);
    }).toPass({ timeout: 10_000 });

    // 一時停止
    await playButton.click();
  });
});

test.describe("投稿詳細 - 写真", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("写真がcover拡縮し、画像サイズが著しく荒くない", async ({ page }) => {
    await page.goto("/");
    await page.locator("article").first().waitFor({ timeout: 3_000 });
    const imageArticle = page.locator("article:has(.grid img)").first();
    await expect(imageArticle).toBeVisible({ timeout: 3_000 });
    await imageArticle.click();
    await page.waitForURL("**/posts/*", { timeout: 10_000, waitUntil: "commit" });

    const coveredImage = page.locator(".grid img").first();
    await expect(coveredImage).toBeVisible({ timeout: 3_000 });

    const objectFit = await coveredImage.evaluate((el) => {
      return window.getComputedStyle(el).objectFit;
    });
    expect(objectFit).toBe("cover");

    await coveredImage.evaluate((el: HTMLImageElement) => el.decode());

    const naturalWidth = await coveredImage.evaluate((el: HTMLImageElement) => el.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(100);

    // VRT: 写真投稿詳細
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("post-detail-写真.png", {
      mask: dynamicMediaMask(page),
    });
  });

  test("「ALT を表示する」ボタンを押すと、画像の ALT が表示されること", async ({ page }) => {
    await page.goto("/");
    await page.locator("article").first().waitFor({ timeout: 3_000 });
    const imageArticle = page.locator("article:has(.grid img)").first();
    await expect(imageArticle).toBeVisible({ timeout: 3_000 });
    await imageArticle.locator("time").first().click();
    await page.waitForURL("**/posts/*", { timeout: 10_000, waitUntil: "commit" });

    // ALTボタンを探す
    const altButton = page.getByRole("button", { name: "ALT を表示する" }).first();
    await expect(altButton).toBeVisible({ timeout: 3_000 });
    await altButton.click();

    // モーダルが開いて「画像の説明」見出しと ALT テキストが表示される
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible({ timeout: 3_000 });
    await expect(dialog.getByText("画像の説明")).toBeVisible();

    // ALTテキストが空でないこと
    const altText = dialog.locator("p.text-sm");
    await expect(altText).toBeVisible();
    const text = await altText.innerText();
    expect(text.length).toBeGreaterThan(0);

    // 閉じるボタンで閉じる
    await dialog.getByRole("button", { name: "閉じる" }).click();
  });
});
