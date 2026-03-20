const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: 'http://localhost:3000' });
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error));
  
  await page.goto('/signin');
  // wait for it
  await page.waitForTimeout(1000);
})();
