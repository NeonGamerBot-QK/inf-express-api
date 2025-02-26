// default template
module.exports = (router, db) => {
  router.use((req, res, next) => {
    if (req.headers["authorization"] !== process.env.IMESSAGE_TOKEN)
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
  router.post('/matrix/toggle_sleep',async (req, res) => {
    const cv = await db.get("sleeping") || false,
    await db.set("sleeping", !cv)
    res.status(200).end()
  })
  router.get("/matrix/status", async (req, res) => {
    res.json({
      is_sleeping: (await db.get("sleeping")) || false,
    });
  });
  router.get("/camera_alert", (req, res) => {
    // TODO: spawn ring camera
    res.status(501).end();
  });
};
