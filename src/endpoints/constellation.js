// default template
module.exports = (router, db) => {
  router.use(async (req, res, next) => {
    const visits = (await db.get("visits")) || 0;
    req.visits = visits;
    await db.set("visits", visits + 1);
    next();
  });
  router.all("/", (req, res) =>
    res.json({
      city: "Secret",
      state: "Kentucky",
      extra: "This property is not static: " + Math.random().toFixed(2),
      slack_id: "U07L45W79E1",
    }),
  );
  router.get("/visits", async (req, res) => {
    const visits = req.visits;
    res.json({ visits });
  });
  router.get("/healthcheck", async (req, res) => {
    try {
      await db.set(Date.now().toString().slice(0, 4), 1);
      await db.get(Date.now().toString().slice(0, 4));
      await db.delete(Date.now().toString().slice(0, 4));
      res.send({
        status: 200,
        message: "OK",
      });
    } catch (e) {
      res.status(500).send({ message: e.message });
    }
  });
};
module.exports.socket_handle = (socket, io, db) => {
  socket.emit("ping");
  socket.on("pong", () => {
    socket.emit("ping");
  });
};
