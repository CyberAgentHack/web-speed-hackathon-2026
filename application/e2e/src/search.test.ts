import { expect, test } from "@playwright/test";

import { dynamicMediaMask, scrollEntire, waitForVisibleMedia } from "./utils";

test.describe("検索ページ", () => {
  test("検索ページが表示される", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/search");
    await scrollEntire(page);

    // VRT: 検索ページ
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("search-検索ページ.png", {
      fullPage: true,
      mask: dynamicMediaMask(page),
    });
  });

  test("タイトルが「検索 - CaX」となること", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/search");
    await expect(page).toHaveTitle("検索 - CaX", { timeout: 10_000 });
  });

  test.describe("検索フォーム", () => {
    test("入力欄のプレースホルダーが「検索 (例: キーワード since:2025-01-01 until:2025-12-31)」であること", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/search");

      const input = page.getByPlaceholder(
        "検索 (例: キーワード since:2025-01-01 until:2025-12-31)",
      );
      await expect(input).toBeVisible({ timeout: 10_000 });
    });

    test("「since:YYYY-MM-DD で開始日、until:YYYY-MM-DD で終了日を指定できます」のヘルプテキストが表示されること", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/search");

      await expect(
        page.getByText("since:YYYY-MM-DD で開始日、until:YYYY-MM-DD で終了日を指定できます"),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("バリデーション", () => {
    test("空のまま検索するとエラーが表示される", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/search");

      await page.getByRole("button", { name: "検索" }).click();

      await expect(page.getByText("検索キーワードを入力してください")).toBeVisible({
        timeout: 10_000,
      });
    });

    test("不正な since: 日付形式でエラーが表示される", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/search");

      const input = page.getByPlaceholder(
        "検索 (例: キーワード since:2025-01-01 until:2025-12-31)",
      );
      await input.fill("since:2025-99-99");
      await page.getByRole("button", { name: "検索" }).click();

      await expect(page.getByText("since: の日付形式が不正です: 2025-99-99")).toBeVisible({
        timeout: 10_000,
      });
    });

    test("since: が until: より後の日付でエラーが表示される", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/search");

      const input = page.getByPlaceholder(
        "検索 (例: キーワード since:2025-01-01 until:2025-12-31)",
      );
      await input.fill("テスト since:2025-12-01 until:2025-01-01");
      await page.getByRole("button", { name: "検索" }).click();

      await expect(page.getByText("since: は until: より前の日付を指定してください")).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  test("検索結果が表示される", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/search?q=写真");

    await expect(page.locator("main article").first()).toBeVisible({ timeout: 30_000 });

    // 検索条件と件数を含む見出しが表示される
    const heading = page.locator("main h2");
    await expect(heading).toContainText("「写真」");
    await expect(heading).toContainText("の検索結果");
    await expect(heading).toContainText("件)");

    // VRT: 検索結果
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("search-検索結果.png", {
      mask: dynamicMediaMask(page),
    });
  });

  test("キーワードと since:YYYY-MM-DD を組み合わせて検索できること", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/search");

    const input = page.getByPlaceholder("検索 (例: キーワード since:2025-01-01 until:2025-12-31)");
    await input.fill("写真 since:2026-01-01");
    await page.getByRole("button", { name: "検索" }).click();

    await page.waitForURL(/\/search\?q=/, { timeout: 10_000 });

    const heading = page.locator("main h2");
    await expect(heading).toContainText("「写真」");
    await expect(heading).toContainText("2026-01-01 以降");
    await expect(heading).toContainText("の検索結果");
  });

  test("キーワードと since:YYYY-MM-DD until:YYYY-MM-DD を組み合わせて検索できること", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/search");

    const input = page.getByPlaceholder("検索 (例: キーワード since:2025-01-01 until:2025-12-31)");
    await input.fill("写真 since:2026-01-01 until:2026-12-31");
    await page.getByRole("button", { name: "検索" }).click();

    await page.waitForURL(/\/search\?q=/, { timeout: 10_000 });

    const heading = page.locator("main h2");
    await expect(heading).toContainText("「写真」");
    await expect(heading).toContainText("2026-01-01 以降");
    await expect(heading).toContainText("2026-12-31 以前");
    await expect(heading).toContainText("の検索結果");
  });

  test("スコアリング相当の長い検索クエリでも入力と再検索ができること", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/search");

    const input = page.getByPlaceholder("検索 (例: キーワード since:2025-01-01 until:2025-12-31)");
    await input.pressSequentially(`アニメ since:2026-01-06${"0".repeat(20)}x`);
    await page.getByRole("button", { name: "検索" }).click();

    const heading = page.locator("main h2");
    await expect(heading).toContainText("「アニメ」", { timeout: 30_000 });

    await input.clear();
    await input.pressSequentially(
      `アニメ since:2026-01-06${"0".repeat(10)}x until:2026-01-06${"0".repeat(10)}x`,
    );
    await page.getByRole("button", { name: "検索" }).click();

    await expect(heading).toContainText("2026-01-06 以降", { timeout: 30_000 });
    await expect(heading).toContainText("2026-01-06 以前");
  });

  test("検索結果が見つからない場合、「検索結果が見つかりませんでした」と表示されること", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/search?q=xyzzynonexistent12345");

    await expect(page.getByText("検索結果が見つかりませんでした")).toBeVisible({
      timeout: 30_000,
    });
  });

  // ネガティブ判定には単語感情極性対応表が使用されている
  //   辞書: http://www.lr.pi.titech.ac.jp/~takamura/pndic_ja.html
  //   ライブラリ: https://github.com/azu/negaposi-analyzer-ja
  //
  // スコア算出ロジック:
  //   1. kuromoji で形態素解析しトークン化
  //   2. 各トークンを辞書 (pn_ja.dic) で検索し rank (-1〜+1) を取得
  //   3. ネガティブ単語には補正係数 (posi数/nega数 = 5122/49983 ≈ 0.1025) を乗算
  //      → 辞書のネガティブ語が圧倒的に多いため、未補正だと殆どネガティブになる
  //   4. 最終スコア = 全トークンの補正済みスコア合計 / トークン数
  //   5. score < -0.1 → negative, score > 0.1 → positive, それ以外 → neutral
  //
  // テストで使用する単語と辞書上の値:
  //   | 単語   | 辞書 rank  | 補正後スコア | 判定     |
  //   |--------|------------|--------------|----------|
  //   | 悲しい | -0.999102  | -0.102383    | negative |
  //   | 嬉しい | +0.998871  | +0.998871    | positive |
  //   | 惑い   | -0.976115  | -0.100027    | negative | ← 境界をわずかに下回る
  //   | 没落   | -0.975572  | -0.099972    | neutral  | ← 境界をわずかに上回る
  //   | 嫌い   | -0.629629  | -0.064521    | neutral  | ← 補正で緩和される例
  test.describe("ネガティブ判定", () => {
    test("ネガティブな検索クエリのとき、「どしたん話聞こうか?」のメッセージが表示される", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      // 「悲しい」: 辞書 rank=-0.999102 → 補正後スコア≈-0.1024 (< -0.1 → negative)
      await page.goto("/search?q=悲しい");

      await expect(page.getByText("どしたん話聞こうか?")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText("言わなくてもいいけど、言ってもいいよ。")).toBeVisible();
    });

    test("ポジティブな検索クエリのとき、「どしたん話聞こうか?」のメッセージが表示されない", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      // 「嬉しい」: 辞書 rank=+0.998871 → 補正なしスコア≈+0.999 (> 0.1 → positive)
      await page.goto("/search?q=嬉しい");

      await expect(page.getByText("検索結果が見つかりませんでした")).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText("どしたん話聞こうか?")).not.toBeVisible();
    });

    test("補正係数により境界値(-0.1)をわずかに下回る単語でネガティブ判定される", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      // 「惑い」: 辞書 rank=-0.976115 → 補正後スコア≈-0.100027 (< -0.1 → negative)
      await page.goto("/search?q=惑い");

      await expect(page.getByText("どしたん話聞こうか?")).toBeVisible({ timeout: 30_000 });
    });

    test("補正係数により境界値(-0.1)をわずかに上回る単語ではネガティブ判定されない", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      // 「没落」: 辞書 rank=-0.975572 → 補正後スコア≈-0.099972 (> -0.1 → neutral)
      await page.goto("/search?q=没落");

      await expect(page.getByText("検索結果が見つかりませんでした")).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText("どしたん話聞こうか?")).not.toBeVisible();
    });

    test("直感的にネガティブでも補正係数により中立判定される単語がある", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      // 「嫌い」: 辞書 rank=-0.629629 → 補正後スコア≈-0.0645 (> -0.1 → neutral)
      // ネガティブ辞書が多いため補正係数で緩和され、中立と判定される
      await page.goto("/search?q=嫌い");

      await expect(page.getByText("検索結果が見つかりませんでした")).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText("どしたん話聞こうか?")).not.toBeVisible();
    });
  });

  test("検索結果のタイムラインが無限スクロールで追加読み込みされること", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/search?q=写真");

    await expect(page.locator("main article").first()).toBeVisible({ timeout: 30_000 });

    const initialCount = await page.locator("main article").count();
    expect(initialCount).toBeGreaterThanOrEqual(1);
    expect(initialCount).toBeLessThanOrEqual(30);

    // ページ下部までスクロールして追加読み込みをトリガー
    await expect(async () => {
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((resolve) => setTimeout(resolve, 200));
        window.scrollTo(0, document.body.scrollHeight);
      });
      const newCount = await page.locator("main article").count();
      expect(newCount).toBeGreaterThan(initialCount);
    }).toPass({ timeout: 30_000 });
  });
});
