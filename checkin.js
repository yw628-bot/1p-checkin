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
  } catch {
    return [];
  }
}

function logStep(step, data) {
  console.log(`\n===== [${step}] =====`);
  console.log(data);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
  });

  await context.addCookies(normalizeCookies(process.env.COOKIES || ""));

  const page = await context.newPage();

  try {
    // =========================
    // 1️⃣ LANDING
    // =========================
    await page.goto(
      "https://www.1point3acres.com/next/daily-checkin",
      { waitUntil: "domcontentloaded" }
    );

    await page.waitForTimeout(5000);

    logStep("STEP1_URL", page.url());
    logStep("STEP1_TITLE", await page.title());

    await page.screenshot({ path: "step1_landing.png", fullPage: true });

    // =========================
    // 2️⃣ PAGE READY CHECK
    // =========================
    const btnCount = await page.getByText("签到").count();
    const altBtnCount = await page.getByText("立即签到").count();

    logStep("STEP2_BUTTON_CHECK", {
      "签到按钮": btnCount,
      "立即签到按钮": altBtnCount,
    });

    if (btnCount === 0 && altBtnCount === 0) {
      console.log("❌ DIAGNOSIS: PAGE_NOT_READY_OR_BLOCKED");
    }

    // =========================
    // 3️⃣ CLICK ATTEMPT
    // =========================
    let clicked = false;

    const targets = [
      page.getByText("签到"),
      page.getByText("立即签到"),
      page.locator("button"),
    ];

    for (const t of targets) {
      try {
        if (await t.count() > 0) {
          await t.first().click({ timeout: 3000 });
          clicked = true;
          break;
        }
      } catch {}
    }

    logStep("STEP3_CLICK", { clicked });

    await page.waitForTimeout(5000);

    await page.screenshot({ path: "step3_after_click.png", fullPage: true });

    // =========================
    // 4️⃣ RESULT CHECK
    // =========================
    const content = await page.content();

    const success = content.includes("恭喜你签到成功");
    const already = content.includes("今日已签到");

    logStep("STEP4_RESULT_FLAGS", {
      success,
      already,
    });

    // =========================
    // 5️⃣ FINAL DIAGNOSIS
    // =========================
    if (success) {
      console.log("\n🎉 REAL_SUCCESS");
    } else if (already) {
      console.log("\n🟡 ALREADY_DONE");
    } else if (!clicked) {
      console.log("\n❌ DIAGNOSIS: BUTTON_NOT_CLICKED");
    } else {
      console.log("\n❌ DIAGNOSIS: CLICKED_BUT_NO_SUCCESS");
    }

  } catch (err) {
    console.log("\n❌ FATAL_ERROR:", err.message);

    await page.screenshot({
      path: "error.png",
      fullPage: true,
    });
  }

  await browser.close();
})();
