const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true, // GitHub Actions 必须 true
  });

  const context = await browser.newContext();

  // ===== Cookie 修复 =====
  const rawCookies = JSON.parse(process.env.COOKIES || "[]");

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

  try {
    // ========================
    // 1️⃣ 打开首页（稳定版）
    // ========================
    await page.goto('https://www.1point3acres.com', {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForTimeout(5000);

    // ========================
    // 2️⃣ 点击“签到”
    // ========================
    await page.getByText('签到', { exact: false }).first().click();

    await page.waitForTimeout(3000);

    // ========================
    // 3️⃣ 点击“没心情”
    // ========================
    await page.getByText('没心情', { exact: false }).first().click();

    await page.waitForTimeout(2000);

    // ========================
    // 4️⃣ 点击“提交签到”
    // ========================
    await page.getByText('提交签到', { exact: false }).first().click();

    await page.waitForTimeout(3000);

    // ========================
    // 5️⃣ 验证结果
    // ========================
    const content = await page.content();

    if (
      content.includes('已签到') ||
      content.includes('签到成功') ||
      content.includes('今日已完成')
    ) {
      console.log('CONFIRMED_SUCCESS');
    } else {
      console.log('UNCERTAIN_OR_FAILED');
    }

    // debug（失败时有用）
    await page.screenshot({ path: 'debug.png', fullPage: true });

  } catch (err) {
    console.log('ERROR:', err.message);

    // 失败截图
    try {
      await page.screenshot({ path: 'error.png', fullPage: true });
    } catch {}
  }

  await browser.close();
})();
