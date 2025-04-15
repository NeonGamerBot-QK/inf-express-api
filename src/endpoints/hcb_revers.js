// default template
module.exports = (router, db) => {
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
  // https://github.com/transcental/SlackHCBGranter/blob/main/slackhcbgranter/utils/hcb/grants.py
  router.post("/grant", async (req, res) => {
    if (req.headers["authorization"] !== process.env.HM_MASTER_KEY)
      return res.status(400).end("BAD KEY");
    const {
      org,
      email,
      amount,
      purpose,
      merchant_id,
      merchant_cats,
      merchant_regex,
    } = req.body;
    res.send("OK SENT");
  });
};
module.exports.socket_handle = (socket, io, db) => {
  socket.emit("ping");
  socket.on("pong", () => {
    socket.emit("ping");
  });
};
