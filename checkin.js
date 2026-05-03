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
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
  });

  await context.addCookies(normalizeCookies(process.env.COOKIES || ""));

  const page = await context.newPage();

  try {
    // =========================
    // STEP 1 - ENTRY NAVIGATION
    // =========================
    await page.goto("https://www.1point3acres.com/bbs/", {
      waitUntil: "domcontentloaded",
    });

    await page.waitForTimeout(4000);

    logStep("STEP1_URL", page.url());
    logStep("STEP1_TITLE", await page.title());

    await page.screenshot({ path: "step1_entry.png", fullPage: true });

    // =========================
    // STEP 2 - CHECKIN PAGE NAVIGATION
    // =========================
    await page.goto(
      "https://www.1point3acres.com/next/daily-checkin",
      { waitUntil: "domcontentloaded" }
    );

    await page.waitForTimeout(5000);

    logStep("STEP2_URL", page.url());
    logStep("STEP2_TITLE", await page.title());

    await page.screenshot({ path: "step2_checkin.png", fullPage: true });

    // =========================
    // STEP 3 - CLOUDFLARE / BLOCK CHECK
    // =========================
    const title = await page.title();

    const isBlocked =
      title.includes("Just a moment") ||
      title.includes("Checking your browser");

    logStep("STEP3_BLOCK_CHECK", {
      blocked: isBlocked,
      title,
    });

    if (isBlocked) {
      console.log("❌ DIAGNOSIS: BLOCKED_BY_CLOUDFLARE");
      await browser.close();
      return;
    }

    // =========================
    // STEP 4 - BUTTON DETECTION
    // =========================
    const btnSelectors = [
      page.getByText("签到"),
      page.getByText("立即签到"),
      page.getByText("Check"),
      page.locator("button"),
      page.locator("a"),
    ];

    let clicked = false;

    for (const btn of btnSelectors) {
      try {
        const count = await btn.count();
        if (count > 0) {
          await btn.first().click({ timeout: 3000 });
          clicked = true;
          break;
        }
      } catch {}
    }

    logStep("STEP4_BUTTON_DETECTION", {
      clicked,
    });

    await page.waitForTimeout(5000);

    await page.screenshot({
      path: "step4_after_click.png",
      fullPage: true,
    });

    // =========================
    // STEP 5 - RESULT ANALYSIS
    // =========================
    const content = await page.content();

    const success = content.includes("恭喜你签到成功");
    const already = content.includes("今日已签到");

    logStep("STEP5_RESULT_FLAGS", {
      success,
      already,
    });

    // =========================
    // FINAL DIAGNOSIS (UNCHANGED STYLE)
    // =========================
    if (success) {
      console.log("\n🎉 REAL_SUCCESS");
    } else if (already) {
      console.log("\n🟡 ALREADY_DONE");
    } else if (isBlocked) {
      console.log("\n❌ DIAGNOSIS: BLOCKED_BY_CLOUDFLARE");
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
