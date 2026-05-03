const { chromium } = require('playwright');

function normalizeCookies(cookieInput) {
  try {
    const parsed = JSON.parse(cookieInput);
    if (Array.isArray(parsed)) {
      return parsed.map(c => ({
        name: c.name,
        value: c.value,
        domain: ".1point3acres.com",
        path: "/",
      }));
    }
    return [];
  } catch (e) {
    return [];
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
  });

  await context.addCookies(normalizeCookies(process.env.COOKIES || ""));

  const page = await context.newPage();

  try {
    // =========================
    // 1️⃣ 打开签到页面
    // =========================
    await page.goto(
      "https://www.1point3acres.com/next/daily-checkin",
      { waitUntil: "domcontentloaded" }
    );

    await page.waitForTimeout(5000);

    // =========================
    // 2️⃣ 点击签到按钮（关键修复点）
    // =========================
    const btn = page.locator('text=签到, text=立即签到, text=Sign');

    if (await btn.count() > 0) {
      await btn.first().click();
      await page.waitForTimeout(3000);
    }

    // =========================
    // 3️⃣ 判断结果（唯一可靠方式）
    // =========================
    const content = await page.content();

    if (content.includes("恭喜你签到成功")) {
      console.log("REAL_SUCCESS");
    } else if (content.includes("今日已签到")) {
      console.log("ALREADY_DONE");
    } else {
      console.log("FAILED");
    }

    await page.screenshot({ path: "result.png", fullPage: true });

  } catch (err) {
    console.log("ERROR:", err.message);
    await page.screenshot({ path: "error.png" });
  }

  await browser.close();
})();
