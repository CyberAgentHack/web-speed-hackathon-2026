import { signInWithDefaultUser } from "../src/utils/signin_with_default_user";
import { createPage } from "../src/utils/create_page";
import { goTo } from "../src/utils/go_to";

const DEVICE = {
  deviceScaleFactor: 1,
  hasTouch: false,
  isMobile: false,
  viewport: {
    height: 1080,
    width: 1920,
  },
};

async function main() {
  using pageSet = await createPage({ device: DEVICE });
  const { playwrightPage, puppeteerPage } = pageSet;

  playwrightPage.on("pageerror", (error) => {
    console.error("pageerror", error);
  });
  playwrightPage.on("console", (message) => {
    if (message.type() === "error") {
      console.error("console.error", message.text());
    }
  });
  playwrightPage.on("response", async (response) => {
    if (response.url().includes("/api/v1/dm/33881deb-da8a-4ca9-a153-2f80d5fa7af8")) {
      console.log("dm response", response.status(), response.url());
      try {
        console.log("dm body preview", (await response.text()).slice(0, 400));
      } catch {
        console.log("dm body preview", "<unavailable>");
      }
    }
  });

  await goTo({
    playwrightPage,
    puppeteerPage,
    timeout: 120_000,
    url: "http://localhost:3000/not-found",
  });
  await signInWithDefaultUser({ page: playwrightPage });
  await goTo({
    playwrightPage,
    puppeteerPage,
    timeout: 120_000,
    url: "http://localhost:3000/dm/33881deb-da8a-4ca9-a153-2f80d5fa7af8",
  });

  await playwrightPage.waitForTimeout(5_000);

  console.log("url", playwrightPage.url());
  console.log(
    "body text",
    (
      await playwrightPage.locator("body").innerText().catch(() => "")
    ).slice(0, 1000),
  );
  console.log(
    "headings",
    await playwrightPage.getByRole("heading").allInnerTexts().catch(() => []),
  );
  console.log(
    "buttons",
    await playwrightPage.getByRole("button").allInnerTexts().catch(() => []),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
