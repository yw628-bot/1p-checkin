const fetch = require('node-fetch');

(async () => {
  try {
    const res = await fetch(
      "https://api.1point3acres.com/api/users/checkin",
      {
        method: "POST",
        headers: {
          "cookie": process.env.COOKIES,
          "content-type": "application/json",
          "user-agent": "Mozilla/5.0"
        },
        body: JSON.stringify({})
      }
    );

    const text = await res.text();

    console.log("RESPONSE:", text);

    // =========================
    // 🎯 最终判定逻辑（定稿）
    // =========================

    if (text.includes("恭喜你签到成功")) {
      console.log("REAL_SUCCESS");   // 本次成功签到

    } else if (text.includes("今日已签到")) {
      console.log("ALREADY_DONE");   // 今天已经签过（正常状态）

    } else {
      console.log("FAILED");        // 异常情况
    }

  } catch (err) {
    console.log("ERROR:", err.message);
  }
})();
