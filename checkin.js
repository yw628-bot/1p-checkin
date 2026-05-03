function normalizeCookies(cookieInput) {
  try {
    const parsed = JSON.parse(cookieInput);

    // 如果是数组（Playwright格式）
    if (Array.isArray(parsed)) {
      return parsed
        .map(c => `${c.name}=${c.value}`)
        .join('; ');
    }

    return cookieInput;
  } catch (e) {
    // 已经是 string
    return cookieInput;
  }
}

(async () => {
  try {

    const cookieHeader = normalizeCookies(process.env.COOKIES || "");

    const res = await fetch(
      "https://api.1point3acres.com/api/users/checkin",
      {
        method: "POST",
        headers: {
          "cookie": cookieHeader,
          "content-type": "application/json",
          "user-agent": "Mozilla/5.0"
        },
        body: JSON.stringify({})
      }
    );

    const text = await res.text();

    console.log("RESPONSE:", text);

    if (text.includes("恭喜你签到成功")) {
      console.log("REAL_SUCCESS");

    } else if (text.includes("今日已签到")) {
      console.log("ALREADY_DONE");

    } else {
      console.log("FAILED");
    }

  } catch (err) {
    console.log("ERROR:", err.message);
  }
})();
