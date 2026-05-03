const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // 修复 cookie
  const rawCookies = JSON.parse(process.env.COOKIES);
  const cookies = rawCookies.map(c => {
    if (c.sameSite) {
      const val = c.sameSite.toLowerCase();
      if (val === 'lax') c.sameSite = 'Lax';
      else if (val === 'strict') c.sameSite = 'Strict';
      else if (val === 'none') c.sameSite = 'None';
      else delete c.sameSite;
    }
    return c;
  });

  await context.addCookies(cookies);

  const page = await context.newPage();

  // 1️⃣ 打开首页
  await page.goto('https://www.1point3acres.com', { waitUntil: 'domcontentloaded' });

  // 2️⃣ 点击“签到”
  await page.click('text=签到');

  // 等页面跳转
  await page.waitForTimeout(2000);

  // 3️⃣ 点击“没心情”
  await page.click('text=没心情');

  // 4️⃣ 点击“提交签到”
  await page.click('text=提交签到');

  await page.waitForTimeout(2000);

  // 5️⃣ 验证结果
  const content = await page.content();

  if (content.includes('已签到') || content.includes('签到成功')) {
    console.log('CONFIRMED_SUCCESS');
  } else {
    console.log('FAILED_CHECKIN');
  }

  await browser.close();
})();
