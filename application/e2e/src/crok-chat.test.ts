import { expect, test } from "@playwright/test";

import { dynamicMediaMask, login, waitForVisibleMedia } from "./utils";

interface SSEChunkPayload {
  text?: string;
  done?: boolean;
}

test.describe("Crok AIチャット", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await login(page);
    await page.getByRole("link", { name: "Crok" }).click();
    await page.waitForURL("**/crok", { timeout: 10_000 });
  });

  test("サジェスト候補が表示される", async ({ page }) => {
    // VRT: Crokページ
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("crok-Crok.png", {
      mask: dynamicMediaMask(page),
    });

    const chatInput = page.getByPlaceholder("メッセージを入力...");
    await chatInput.pressSequentially("TypeScriptの型");

    const suggestions = page.getByRole("listbox", { name: "サジェスト候補" });
    await suggestions.waitFor({ timeout: 30_000 });

    const buttons = suggestions.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    const texts = await buttons.allInnerTexts();
    expect(texts.some((t) => /TypeScript|型/.test(t))).toBe(true);

    // VRT: サジェスト表示後
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("crok-サジェスト表示後.png", {
      mask: dynamicMediaMask(page),
    });
  });

  test("質問を送信するとAIの応答が表示される", async ({ page }) => {
    await page.route("**/api/v1/crok?**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      await route.fulfill({
        contentType: "text/event-stream",
        body: `data: {"text":"結論から言うね"}\n\ndata: {"done":true}\n\n`,
        status: 200,
      });
    });

    const chatInput = page.getByPlaceholder("メッセージを入力...");
    const prompt =
      "『走れメロス』って、冷笑系の“どうせ人なんか信じても無駄”に対する話なんだと思うんだけどどう？";
    await chatInput.fill(prompt);

    // 送信ボタンをクリック
    await page.getByRole("button", { name: "送信" }).click();

    // ユーザーメッセージが表示される
    await expect(page.getByText(prompt)).toBeVisible({
      timeout: 10_000,
    });

    // ストリーミング中の表示を確認
    await expect(page.getByRole("status", { name: "応答中" })).toBeVisible({
      timeout: 10_000,
    });

    // SSE完了を待つ（フッターテキストが変わる）
    await expect(page.getByText("Crok AIは間違いを起こす可能性があります。")).toBeVisible({
      timeout: 300_000,
    });

    // レスポンス内容が表示されている（固定レスポンスの冒頭）
    await expect(page.getByText("結論から言うね")).toBeVisible();

    // VRT: AI応答完了後
    await waitForVisibleMedia(page);
    await expect(page).toHaveScreenshot("crok-AI応答完了後.png", {
      mask: dynamicMediaMask(page),
    });
  });

  test("SSEレスポンスが文字単位ではなくチャンク単位で返る", async ({ page }) => {
    const signinResponse = await page.request.post("/api/v1/signin", {
      data: { username: "o6yq16leo", password: "wsh-2026" },
    });
    expect(signinResponse.ok()).toBe(true);

    const res = await page.request.get("/api/v1/crok");
    expect(res.ok()).toBe(true);

    const body = await res.text();
    const events = body
      .split("\n\n")
      .map((block) => block.trim())
      .filter((block) => block.startsWith("event: message"));

    const payloads = events
      .map((eventText) => eventText.match(/^data:\s*(.+)$/m)?.[1] ?? "")
      .filter((jsonText) => jsonText.length > 0)
      .map((jsonText) => JSON.parse(jsonText) as SSEChunkPayload);

    const chunks = payloads.filter((payload) => payload.done !== true);
    const joinedTextLength = chunks.map((payload) => payload.text ?? "").join("").length;

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.length).toBeLessThan(joinedTextLength);
    expect(payloads.at(-1)?.done).toBe(true);
  });
});
