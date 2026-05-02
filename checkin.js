const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  const cookies = JSON.parse(process.env.COOKIES);
  await context.addCookies(cookies);

  const page = await context.newPage();

  await page.goto('https://www.1point3acres.com/bbs/home.php?mod=task&do=apply&id=2');

  try {
    await page.click('text=签到');
    console.log('SUCCESS');
  } catch (e) {
    console.log('FAILED_OR_ALREADY_DONE');
  }

  await browser.close();
})();
