const { chromium } = require('playwright');

function normalizeCookies(cookieInput) {
  try {
    const parsed = JSON.parse(cookieInput);

    if (Array.isArray(parsed)) {
      return parsed.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain || ".1point3acres.com",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      }));
    }

    return [];
  } catch (e) {
    return [];
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  });

  // =========================
  // 1️⃣ 注入真实 cookie（浏览器态）
  // =========================
  const cookies = normalizeCookies(process.env.COOKIES || "");
  await context.addCookies(cookies);

  const page = await context.newPage();

  try {
    // =========================
    // 2️⃣ 先进入页面（建立真实 session）
    // =========================
    await page.goto(
      "https://www.1point3acres.com/next/daily-checkin",
      { waitUntil: "domcontentloaded" }
    );

    await page.waitForTimeout(3000);

    // =========================
    // 3️⃣ 在“浏览器环境”里调用 API（关键）
    // =========================
    const result = await page.evaluate(async () => {
      const res = await fetch(
        "https://api.1point3acres.com/api/users/checkin",
        {
          method: "POST",
          credentials: "include", // 🔥 关键：带上浏览器 session
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      return await res.text();
    });

    console.log("RAW_RESPONSE:", result);

    // =========================
    // 4️⃣ 最终判断
    // =========================
    if (result.includes("恭喜你签到成功")) {
      console.log("REAL_SUCCESS");
    } else if (result.includes("今日已签到")) {
      console.log("ALREADY_DONE");
    } else if (result.includes("人机验证")) {
      console.log("NEED_VERIFICATION");
    } else {
      console.log("FAILED");
    }

    await page.screenshot({ path: "debug.png", fullPage: true });

  } catch (err) {
    console.log("ERROR:", err.message);
    await page.screenshot({ path: "error.png", fullPage: true });
  }

  await browser.close();
})();
