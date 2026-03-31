import puppeteer from 'puppeteer';

(async () => {
  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));
  
  console.log("Navigating to http://localhost:3000/");
  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    console.log("Finished Navigation.");
  } catch (e) {
    console.error("Navigation failed:", e);
  }
  
  await browser.close();
  console.log("Done.");
})();
