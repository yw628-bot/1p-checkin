const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext();

  // =========================
  // 1️⃣ 修复 Cookie
  // =========================
  const rawCookies = JSON.parse(process.env.COOKIES || "[]");

  const cookies = rawCookies.map(c => {
    if (c.sameSite) {
      const v = c.sameSite.toLowerCase();
      if (v === 'lax') c.sameSite = 'Lax';
      else if (v === 'strict') c.sameSite = 'Strict';
      else if (v === 'none') c.sameSite = 'None';
      else delete c.sameSite;
    }
    return c;
  });

  await context.addCookies(cookies);

  const page = await context.newPage();

  try {
    // =========================
    // 2️⃣ 直接进入任务页（关键修复）
    // =========================
    await page.goto(
      'https://www.1point3acres.com/bbs/home.php?mod=task',
      { waitUntil: 'domcontentloaded' }
    );

    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'step1-task.png', fullPage: true });

    // =========================
    // 3️⃣ 点击“签到”
    // =========================
    const signBtn = page
      .locator('a, button')
      .filter({ hasText: '签到' })
      .first();

    await signBtn.click({ timeout: 10000 });

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'step2-sign.png', fullPage: true });

    // =========================
    // 4️⃣ 点击“没心情”
    // =========================
    const moodBtn = page
      .locator('a, button, label, div')
      .filter({ hasText: '没心情' })
      .first();

    await moodBtn.click({ timeout: 10000 });

    await page.waitForTimeout(2000);

    // =========================
    // 5️⃣ 点击“提交签到”
    // =========================
    const submitBtn = page
      .locator('a, button, input')
      .filter({ hasText: '提交' })
      .first();

    await submitBtn.click({ timeout: 10000 });

    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'step3-submit.png', fullPage: true });

    // =========================
    // 6️⃣ 最终验证
    // =========================
    const content = await page.content();

    if (
      content.includes('已签到') ||
      content.includes('签到成功') ||
      content.includes('今日已完成')
    ) {
      console.log('CONFIRMED_SUCCESS');
    } else {
      console.log('UNCERTAIN_OR_ALREADY_DONE');
    }

  } catch (err) {
    console.log('ERROR:', err.message);

    await page.screenshot({
      path: 'error.png',
      fullPage: true,
    });
  }

  await browser.close();
})();
