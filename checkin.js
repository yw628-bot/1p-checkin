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
    // 2️⃣ 进入最稳入口（不是 task）
    // =========================
    await page.goto(
      'https://www.1point3acres.com/bbs/home.php?mod=space',
      { waitUntil: 'domcontentloaded' }
    );

    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'step1-home.png', fullPage: true });

    // =========================
    // 3️⃣ 找“签到入口”（宽松匹配）
    // =========================
    const entryCandidates = page.locator('a, button, div').filter({
      hasText: /签到|打卡|每日|check/i
    });

    const entryCount = await entryCandidates.count();

    if (entryCount > 0) {
      await entryCandidates.first().click();
    } else {
      console.log('NO_ENTRY_FOUND');
    }

    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'step2-entry.png', fullPage: true });

    // =========================
    // 4️⃣ 点击“没心情”（如果存在）
    // =========================
    const mood = page.locator('a, button, div, label').filter({
      hasText: /没心情|neutral|不想/i
    });

    if (await mood.count() > 0) {
      await mood.first().click();
    }

    await page.waitForTimeout(2000);

    // =========================
    // 5️⃣ 点击“提交签到”
    // =========================
    const submit = page.locator('a, button, input').filter({
      hasText: /提交|签到|确认|submit/i
    });

    if (await submit.count() > 0) {
      await submit.first().click();
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'step3-submit.png', fullPage: true });

    // =========================
    // 6️⃣ 最终验证
    // =========================
    const content = await page.content();

    if (
      content.includes('已签到') ||
      content.includes('签到成功') ||
      content.includes('今日已完成') ||
      content.includes('success')
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
