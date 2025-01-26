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
};
