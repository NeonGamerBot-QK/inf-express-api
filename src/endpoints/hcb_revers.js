// default template
module.exports = (router, db) => {
  setInterval(
    async () => {
      const creds = await db.get("oauth2_creds");
      if (creds) {
        const response = await fetch(
          "https://hcb.hackclub.com/api/v4/oauth/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: process.env.HM_HCB_CLIENT_ID,
              client_secret: process.env.HM_HCB_CLIENT_SECRET,
              refresh_token: creds.refresh_token,
              grant_type: "refresh_token",
              redirect_uri: "https://hackclub.com",
            }),
          },
        )
          .then((d) => {
            console.log(`Meow guess what it worked`);
            return d.json();
          })
          .then((json) => {
            db.set(`oauth2_creds`, json);
          });
      }
    },
    60 * 1000 * 60,
  );
  router.get("/:slug/available", (req, res) => {
    fetch("https://hcb.hackclub.com/capture-the-flag/validate_slug", {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-csrf-token": process.env.HCB_CSRF_TOKEN,
        cookie: process.env.HCB_COOKIE,
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: JSON.stringify({ value: req.params.slug }),
      method: "POST",
    })
      .then((r) => r.json())
      .then((json) => res.json(json));
  });
  router.get("/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) {
      return res.status(400).end(`No code??!`);
    }
    const yummyAuthData = await fetch(
      `https://hcb.hackclub.com/api/v4/oauth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.HM_HCB_CLIENT_ID,
          client_secret: process.env.HM_HCB_CLIENT_SECRET,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: process.env.HM_HCB_CLIENT_URI,
        }),
      },
    ).then((r) => r.json());
    console.log(yummyAuthData);
    if (yummyAuthData.error) {
      return res.status(500).json({
        error: yummyAuthData.error_description,
        code: yummyAuthData.error,
      });
    }
    const userData = await fetch(
      `https://` + "hcb.hackclub.com" + "/api/v4/user",
      {
        headers: {
          Authorization: `Bearer ${yummyAuthData.access_token}`,
        },
      },
    ).then((r) => r.json());
    console.log(userData, yummyAuthData);

    if (userData.error) {
      return res.status(500).json({ error: userData.error });
    }
    if (userData.id !== "usr_VAtlLX") {
      return res.status(401).json({ error: `heyyy your not neon!!` });
    }
    await db.set(`oauth2_creds`, yummyAuthData);
    // TODO: send slack noti?
    res.json({ userData, yummyAuthData, ok: true });
  });
  router.get("/login", (req, res) => {
    res.redirect(
      `https://hcb.hackclub.com/api/v4/oauth/authorize?client_id=${
        process.env.HM_HCB_CLIENT_ID
      }&redirect_uri=${
        process.env.HM_HCB_CLIENT_URI
      }&response_type=code&scope=${encodeURIComponent("read write")}`,
    );
  });
  // https://github.com/transcental/SlackHCBGranter/blob/main/slackhcbgranter/utils/hcb/grants.py
  router.post("/grant", async (req, res) => {
    if (req.headers["authorization"] !== process.env.HM_MASTER_KEY) {
      return res.status(400).end("BAD KEY");
    }
    const creds = await db.get("oauth2_creds");

    if (!creds) return res.status(503).json({ message: "no creds >:3" });
    const {
      org,
      email,
      amount,
      purpose,
      merchant_id,
      merchant_cats,
      merchant_regex,
    } = req.body;
    fetch(`https://hcb.hackclub.com/api/v4/organizations/${org}/card_grants`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
      },
      body: JSON.stringify({
        amount_cents: amount * 100,
        email,
        merchant_lock: merchant_id,
        category_lock: merchant_cats ? merchant_cats.join(",") : "",
        keyword_lock: merchant_regex,
        purpose: purpose,
      }),
    })
      .then((r) => r.json())
      .then((r) => res.json(r));
    // res.send("OK SENT");
  });
};
module.exports.socket_handle = (socket, io, db) => {
  socket.emit("ping");
  socket.on("pong", () => {
    socket.emit("ping");
  });
};
