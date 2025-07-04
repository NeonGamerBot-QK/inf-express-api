// default template
module.exports = (router, db) => {
  router.use((req, res, next) => {
    if (
      req.headers["authorization"] !== process.env.IMESSAGE_TOKEN &&
      req.query.a !== process.env.IMESSAGE_TOKEN
    )
      return res.status(401).json({
        invalid: true,
        message: "Invalid token",
      });
    next();
  });
  // so pretty much. just static json data :0 (for this route)
  router.get("/matrix-board", async (req, res) => {
    res.json({
      message: "h",
    });
  });
  router.post("/matrix/toggle_sleep", async (req, res) => {
    const cv = (await db.get("sleeping")) || false;

    await db.set("sleeping", !cv);
    res.status(200).end();
  });
  router.get("/matrix/status", async (req, res) => {
    const mybot_data = await fetch(
      "https://mybot.saahild.com/irl/matrix?a=" + process.env.IMESSAGE_TOKEN,
    ).then((r) => r.json());
    res.json({
      is_sleeping: (await db.get("sleeping")) || false,
      ...mybot_data,
    });
  });
  router.get("/camera_alert", (req, res) => {
    // TODO: spawn ring camera
    res.status(501).end();
  });
   router.get('/healthcheck', async (req,res) => {
try {
    await db.set(Date.now().toString().slice(0,4), 1)
    await db.get(Date.now().toString().slice(0,4))
    await db.delete(Date.now().toString().slice(0,4))
            res.send({
            status: 200,
            message: 'OK',
        })
} catch (e) {
    res.status(500).send({ message: e.message })
}
    })
};
