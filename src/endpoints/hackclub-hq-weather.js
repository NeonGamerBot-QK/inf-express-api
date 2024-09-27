// default template
module.exports = (router, db) => {
  //router.get("/");
  router.get("/info", (req, res) => {
    res.send("wsp this is a wip atm");
  });
  router.post("/events", (req, res) => {
    if (!req.body) return;
    console.log(req.body);
    if (req.body.challenge) {
      res.send(req.body.challenge);
      return;
    }
    res.send("ok");
  });
  router.use((err, req, res) => {
    console.error(err.stack);
    res.json(err.message);
  });
};
module.exports.socket_handle = (socket) => {
  socket.emit("hello world");
};
