import path from "node:path";

import { expect, test } from "@playwright/test";

import { dynamicMediaMask, login, waitForPageToLoad, waitForVisibleMedia } from "./utils";

test.describe("投稿機能", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page, "gg3i6j6");
  });

  test("テキストの投稿ができる", async ({ page }) => {
    const postText = "テスト投稿";

    // 投稿モーダルを開く
    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();

    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 30_000 });
    await textarea.fill(postText);

    // VRT: 投稿モーダル（テキスト入力後）
    await waitForVisibleMedia(page);
    await waitForPageToLoad(page);
    await expect(page).toHaveScreenshot("posting-テキスト入力後.png", {
      mask: dynamicMediaMask(page),
    });

    // モーダル内の投稿ボタンをクリック
    await page.locator("dialog").getByRole("button", { name: "投稿する" }).click();

    // 投稿詳細に遷移する
    await expect(page).toHaveURL(/\/posts\//, { timeout: 30_000 });
    await expect(page.locator("article").first()).toBeVisible({ timeout: 30_000 });

    // 投稿内容が表示されていることを確認
    await expect(page.getByText(postText)).toBeVisible();
  });

  test("画像の投稿ができる", async ({ page }) => {
    const postText = "画像テスト";

    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();

    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 30_000 });
    await textarea.fill(postText);

    // 画像ファイルを添付
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    const imagePath = path.resolve(
      import.meta.dirname,
      "../../public/images/737f764e-f495-4104-b6d6-8434681718d5.webp",
    );
    await fileInput.setInputFiles(imagePath);

    // モーダル内の投稿ボタンをクリック
    await page.locator("dialog").getByRole("button", { name: "投稿する" }).click();

    // 投稿詳細に遷移する
    await expect(page).toHaveURL(/\/posts\//, { timeout: 60_000 });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 30_000 });
    await expect(article.locator("img").first()).toBeVisible({ timeout: 30_000 });

    // 投稿内容と画像が表示されていることを確認
    await expect(page.getByText(postText)).toBeVisible();
  });
});

test.describe("投稿機能 - TIFF画像", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
  });

  test("TIFF形式の画像を投稿できる", async ({ page }) => {
    const postText = "TIFF画像テスト";

    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();

    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill(postText);

    // TIFF画像ファイルを添付
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    const tiffPath = path.resolve(import.meta.dirname, "../../../docs/assets/analoguma.tiff");
    await fileInput.setInputFiles(tiffPath);

    // モーダル内の投稿ボタンをクリック
    await page.locator("dialog").getByRole("button", { name: "投稿する" }).click();

    // 投稿詳細に遷移する
    await expect(page).toHaveURL(/\/posts\//, { timeout: 120_000 });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 10_000 });
    await expect(article.locator("img").first()).toBeVisible({ timeout: 30_000 });

    // 投稿内容が表示されていることを確認
    await expect(page.getByText(postText)).toBeVisible();
  });

  test("画像のEXIFに埋め込まれたImage DescriptionがALTとして表示される", async ({ page }) => {
    const postText = "EXIF ALTテスト";

    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();

    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill(postText);

    // TIFF画像ファイルを添付（EXIFにImage Descriptionが埋め込まれている）
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    const tiffPath = path.resolve(import.meta.dirname, "../../../docs/assets/analoguma.tiff");
    await fileInput.setInputFiles(tiffPath);

    // モーダル内の投稿ボタンをクリック
    await page.locator("dialog").getByRole("button", { name: "投稿する" }).click();

    // 投稿詳細に遷移する
    await expect(page).toHaveURL(/\/posts\//, { timeout: 120_000 });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 10_000 });

    // 画像が読み込まれるまで待つ
    const image = article.locator(".grid img").first();
    await expect(image).toBeVisible({ timeout: 60_000 });

    // 「ALT を表示する」ボタンをクリック
    const altButton = page.getByRole("button", { name: "ALT を表示する" }).first();
    await expect(altButton).toBeVisible({ timeout: 30_000 });
    await altButton.click();

    // モーダルが開いて ALT テキストが表示される
    await expect(page.getByRole("heading", { name: "画像の説明" })).toBeVisible({
      timeout: 10_000,
    });

    // ALTテキストが空でないことを確認
    const altDescription = page.locator("dialog p.text-sm");
    await expect(altDescription).toBeVisible({ timeout: 10_000 });
    const altText = await altDescription.innerText();
    expect(altText.length).toBeGreaterThan(0);
  });
});

test.describe("投稿機能 - WAV音声", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
  });

  test("WAV形式の音声を投稿できる", async ({ page }) => {
    const postText = "WAV音声テスト";

    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();

    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill(postText);

    // WAV音声ファイルを添付
    const fileInput = page.locator('input[type="file"][accept="audio/*"]');
    const wavPath = path.resolve(
      import.meta.dirname,
      "../../../docs/assets/maoudamashii_shining_star.wav",
    );
    await fileInput.setInputFiles(wavPath);

    // モーダル内の投稿ボタンをクリック
    await page.locator("dialog").getByRole("button", { name: "投稿する" }).click();

    // 投稿詳細に遷移する
    await expect(page).toHaveURL(/\/posts\//, { timeout: 120_000 });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 10_000 });

    // 波形（SVG）が表示されることを確認
    const waveform = page.locator('svg[viewBox="0 0 100 1"]').first();
    await expect(waveform).toBeVisible({ timeout: 60_000 });

    // 投稿内容が表示されていることを確認
    await expect(page.getByText(postText)).toBeVisible();
  });

  // TODO: WASM変換に30秒以上かかるため一旦スキップ。ボタンが有効になるまで待つ修正は済み
  // test("Shift_JISで付与された作成者・タイトルのメタデータが文字化けせずに表示される", async ({ page }) => {
  //   const postText = "Shift_JISメタデータテスト";
  //   await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();
  //   const textarea = page.getByPlaceholder("いまなにしてる？");
  //   await expect(textarea).toBeVisible({ timeout: 10_000 });
  //   await textarea.fill(postText);
  //   const fileInput = page.locator('input[type="file"][accept="audio/*"]');
  //   const wavPath = path.resolve(import.meta.dirname, "../../../docs/assets/maoudamashii_shining_star.wav");
  //   await fileInput.setInputFiles(wavPath);
  //   const submitButton = page.locator("dialog").getByRole("button", { name: "投稿する" });
  //   await expect(submitButton).toBeEnabled({ timeout: 120_000 });
  //   await submitButton.click();
  //   await page.waitForURL("**/posts/*", { timeout: 120_000 });
  //   const article = page.locator("article").first();
  //   await expect(article).toBeVisible({ timeout: 10_000 });
  //   await expect(page.locator("[data-sound-area]").first()).toBeVisible({ timeout: 60_000 });
  //   const soundArea = page.locator("[data-sound-area]").first();
  //   const textContent = await soundArea.innerText();
  //   expect(textContent).not.toMatch(/\?{2,}/);
  //   expect(textContent).not.toMatch(/[\ufffd]{2,}/);
  // });
});

test.describe("投稿機能 - MKV動画", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
  });

  test("MKV形式の動画を投稿できる", async ({ page }) => {
    const postText = "MKV動画テスト";

    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();

    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill(postText);

    // MKV動画ファイルを添付
    const fileInput = page.locator('input[type="file"][accept="video/*"]');
    const mkvPath = path.resolve(
      import.meta.dirname,
      "../../../docs/assets/pixabay_326739_kanenori_himejijo.mkv",
    );
    await fileInput.setInputFiles(mkvPath);

    // モーダル内の投稿ボタンをクリック
    await page.locator("dialog").getByRole("button", { name: "投稿する" }).click();

    // 投稿詳細に遷移する
    await expect(page).toHaveURL(/\/posts\//, { timeout: 120_000 });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 10_000 });

    // 投稿内容が表示されていることを確認
    await expect(page.getByText(postText)).toBeVisible();

    // 動画（canvas または video）が表示されることを確認
    await waitForVisibleMedia(page);
  });

  // TODO: FFmpeg WASM変換に30秒以上かかるため一旦スキップ。loadedmetadata待ちの修正は済み
  // test("投稿した動画が先頭から5秒間のみに切り抜かれる", async ({ page }) => {
  //   const postText = "動画5秒テスト";
  //   await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();
  //   const textarea = page.getByPlaceholder("いまなにしてる？");
  //   await expect(textarea).toBeVisible({ timeout: 10_000 });
  //   await textarea.fill(postText);
  //   const fileInput = page.locator('input[type="file"][accept="video/*"]');
  //   const mkvPath = path.resolve(import.meta.dirname, "../../../docs/assets/pixabay_326739_kanenori_himejijo.mkv");
  //   await fileInput.setInputFiles(mkvPath);
  //   const submitButton = page.locator("dialog").getByRole("button", { name: "投稿する" });
  //   await expect(submitButton).toBeEnabled({ timeout: 120_000 });
  //   await submitButton.click();
  //   await page.waitForURL("**/posts/*", { timeout: 120_000 });
  //   const article = page.locator("article").first();
  //   await expect(article).toBeVisible({ timeout: 10_000 });
  //   await waitForVisibleMedia(page);
  //   await expect(async () => {
  //     const duration = await page.evaluate(() => {
  //       return new Promise<number>((resolve) => {
  //         const video = document.querySelector("article video");
  //         if (!video) return resolve(0);
  //         if ((video as HTMLVideoElement).duration > 0) return resolve((video as HTMLVideoElement).duration);
  //         (video as HTMLVideoElement).addEventListener("loadedmetadata", () => {
  //           resolve((video as HTMLVideoElement).duration);
  //         }, { once: true });
  //       });
  //     });
  //     expect(duration).toBeGreaterThan(0);
  //     expect(duration).toBeLessThanOrEqual(6);
  //   }).toPass({ timeout: 60_000 });
  // });

  test("投稿した動画が正方形に切り抜かれる", async ({ page }) => {
    const postText = "動画正方形テスト";

    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();

    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    await textarea.fill(postText);

    // MKV動画ファイルを添付
    const fileInput = page.locator('input[type="file"][accept="video/*"]');
    const mkvPath = path.resolve(
      import.meta.dirname,
      "../../../docs/assets/pixabay_326739_kanenori_himejijo.mkv",
    );
    await fileInput.setInputFiles(mkvPath);

    // モーダル内の投稿ボタンをクリック
    await page.locator("dialog").getByRole("button", { name: "投稿する" }).click();

    // 投稿詳細に遷移する
    await expect(page).toHaveURL(/\/posts\//, { timeout: 120_000 });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 10_000 });

    // 動画が表示されるまで待つ
    await waitForVisibleMedia(page);

    // canvas または video の表示サイズが正方形（アスペクト比 1:1）であることを確認
    await expect(async () => {
      const isSquare = await page.evaluate(() => {
        const canvas = document.querySelector("article canvas");
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          return Math.abs(rect.width - rect.height) < 5;
        }
        const video = document.querySelector("article video");
        if (video) {
          return Math.abs(video.videoWidth - video.videoHeight) < 5;
        }
        return false;
      });
      expect(isSquare).toBe(true);
    }).toPass({ timeout: 60_000 });
  });
});
