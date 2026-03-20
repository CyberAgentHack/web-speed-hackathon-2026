import path from "node:path";

import { expect, test } from "@playwright/test";

import { dynamicMediaMask, login, waitForPageToLoad, waitForVisibleMedia } from "./utils";

const ASSETS_DIR = path.resolve(import.meta.dirname, "../../../docs/assets");

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
    await expect(textarea).toBeVisible({ timeout: 3_000 });
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
    await page.waitForURL("**/posts/*", { timeout: 10_000, waitUntil: "commit" });
    await expect(page.locator("article").first()).toBeVisible({ timeout: 10_000 });

    // 投稿内容が表示されていることを確認
    await expect(page.getByText(postText)).toBeVisible();
  });

  test("TIFF 形式の画像を投稿でき、EXIF の Image Description が ALT として表示されること", async ({
    page,
  }) => {
    const postText = "TIFF画像テスト";

    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();

    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 3_000 });
    await textarea.fill(postText);

    // TIFF 形式の画像を添付
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    const imagePath = path.join(ASSETS_DIR, "analoguma.tiff");
    await fileInput.setInputFiles(imagePath);

    // モーダル内の投稿ボタンをクリック（WASM変換に時間がかかる）
    await page.locator("dialog").getByRole("button", { name: "投稿する" }).click();

    // 投稿詳細に遷移する
    await page.waitForURL("**/posts/*", { timeout: 120_000, waitUntil: "commit" });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 3_000 });

    // 画像が表示されていること
    await expect(article.locator(".grid img").first()).toBeVisible({ timeout: 10_000 });

    // EXIF Image Description が ALT として設定されていること
    const altButton = page.getByRole("button", { name: "ALT を表示する" }).first();
    await expect(altButton).toBeVisible({ timeout: 3_000 });
    await altButton.click();

    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible({ timeout: 3_000 });
    const altText = dialog.locator("p.text-sm");
    await expect(altText).toBeVisible();
    const text = await altText.innerText();
    // EXIF から抽出された ALT テキストが空でないこと
    expect(text.length).toBeGreaterThan(0);
  });

  test("WAV 形式の音声を投稿でき、Shift_JIS メタデータが文字化けしないこと", async ({ page }) => {
    const postText = "WAV音声テスト";

    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();

    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 3_000 });
    await textarea.fill(postText);

    // WAV 形式の音声を添付
    const fileInput = page.locator('input[type="file"][accept="audio/*"]');
    const soundPath = path.join(ASSETS_DIR, "maoudamashii_shining_star.wav");
    await fileInput.setInputFiles(soundPath);

    // モーダル内の投稿ボタンをクリック
    await page.locator("dialog").getByRole("button", { name: "投稿する" }).click();

    // 投稿詳細に遷移する
    await page.waitForURL("**/posts/*", { timeout: 60_000, waitUntil: "commit" });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 3_000 });

    // 音声プレイヤー（波形）が表示されること
    const soundArea = page.locator("[data-sound-area]");
    await expect(soundArea).toBeVisible({ timeout: 10_000 });

    // Shift_JIS メタデータが文字化けせずに表示されること
    // タイトルや作成者が日本語で正しく表示されている（□や?に化けていない）
    const soundText = await soundArea.innerText();
    // 文字化け判定: 代替文字（□, ?, ﾃ, ﾖ 等）が含まれていないこと
    expect(soundText).not.toMatch(/[□?]{3,}/);
    // シャイニングスター（サンプル音声のタイトル）が含まれること
    expect(soundText).toContain("シャイニングスター");
  });

  test("MKV 形式の動画を投稿でき、先頭5秒・正方形に切り抜かれること", async ({ page }) => {
    const postText = "MKV動画テスト";

    await page.getByRole("list").getByRole("button", { name: "投稿する" }).click();

    const textarea = page.getByPlaceholder("いまなにしてる？");
    await expect(textarea).toBeVisible({ timeout: 3_000 });
    await textarea.fill(postText);

    // MKV 形式の動画を添付
    const fileInput = page.locator('input[type="file"][accept="video/*"]');
    const videoPath = path.join(ASSETS_DIR, "pixabay_326739_kanenori_himejijo.mkv");
    await fileInput.setInputFiles(videoPath);

    // モーダル内の投稿ボタンをクリック（FFmpeg WASM変換に時間がかかる）
    await page.locator("dialog").getByRole("button", { name: "投稿する" }).click();

    // 投稿詳細に遷移する（動画変換に非常に時間がかかる）
    await page.waitForURL("**/posts/*", { timeout: 300_000, waitUntil: "commit" });

    const article = page.locator("article").first();
    await expect(article).toBeVisible({ timeout: 10_000 });

    // 動画が表示されていること
    const movieArea = page.locator("[data-movie-area]");
    await expect(movieArea).toBeVisible({ timeout: 10_000 });

    // 動画が正方形に切り抜かれていること（アスペクト比 ≈ 1:1）
    await expect(async () => {
      const video = movieArea.locator("video").first();
      const dimensions = await video.evaluate((el: HTMLVideoElement) => ({
        videoWidth: el.videoWidth,
        videoHeight: el.videoHeight,
        readyState: el.readyState,
      }));
      expect(dimensions.readyState).toBeGreaterThanOrEqual(1);
      // 正方形（±10%の誤差許容）
      const ratio = dimensions.videoWidth / dimensions.videoHeight;
      expect(ratio).toBeGreaterThan(0.9);
      expect(ratio).toBeLessThan(1.1);
    }).toPass({ timeout: 30_000 });

    // 動画が5秒以内であること
    await expect(async () => {
      const video = movieArea.locator("video").first();
      const duration = await video.evaluate((el: HTMLVideoElement) => el.duration);
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThanOrEqual(6); // 5秒 + 1秒マージン
    }).toPass({ timeout: 10_000 });
  });
});
