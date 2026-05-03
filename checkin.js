const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext();

  // =========================
  // 1️⃣ Cookie 修复
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
    // 2️⃣ 进入最稳定入口
    // =========================
    await page.goto(
      'https://www.1point3acres.com/bbs/home.php?mod=space',
      { waitUntil: 'domcontentloaded' }
    );

    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'step1.png', fullPage: true });

    // =========================
    // 3️⃣ 尝试点击签到入口（如果存在）
    // =========================
    const entry = page.locator('a, button, div').filter({
      hasText: /签到|打卡|每日|check/i
    });

    if (await entry.count() > 0) {
      await entry.first().click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'step2.png', fullPage: true });

    // =========================
    // 4️⃣ 没心情（可选）
    // =========================
    const mood = page.locator('a, button, div, label').filter({
      hasText: /没心情/i
    });

    if (await mood.count() > 0) {
      await mood.first().click();
      await page.waitForTimeout(2000);
    }

    // =========================
    // 5️⃣ 提交签到（可选）
    // =========================
    const submit = page.locator('a, button, input').filter({
      hasText: /提交|签到|确认|submit/i
    });

    if (await submit.count() > 0) {
      await submit.first().click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'step3.png', fullPage: true });

    // =========================
    // 6️⃣ 🔥 真实验证（核心修复）
    // =========================

    const signBtnCount = await page
      .locator('text=签到')
      .count();

    const alreadyDoneText = await page
      .locator('text=已签到, text=签到成功, text=今日已完成')
      .count();

    if (alreadyDoneText > 0 || signBtnCount === 0) {
      console.log('REAL_SUCCESS');
    } else {
      console.log('FAILED_OR_NOT_DONE');
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
