import { chromium } from 'playwright';

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER_ERROR:', err.message));
  
  console.log("Navigating to localhost:3000...");
  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    console.log("Navigation complete. Taking screenshot...");
    await page.screenshot({ path: 'screenshot.png' });
  } catch (e) {
    console.error("Navigation failed:", e);
  }
  
  await browser.close();
  console.log("Done.");
})();
