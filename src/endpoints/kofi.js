// default template
module.exports = (router, db) => {
  function updateItems(b) {
    const currentItems = db.get("all_webhook");
    currentItems.push(b);
    db.set("all_webhook", currentItems);
  }
  if (!db.get("all_webhook")) db.set("all_webhook", []);
  router.post("/webhook", (req, res) => {
    const body = JSON.parse(req.body.data);
    console.log(body);
    updateItems(body);
    // check if its a shop one
    if (body.type == "Shop Order") {
      // lets extract the identity info
      // address will not be included becuase they should all be digital...
      const email = body.email;
      const transactionId = body.kofi_transaction_id;
      // can pass an ID thru the message
      const message = body.message;
      const items_bought = body.shop_items;
      // const currentItems = db.get('shop_store')
      // TODO:
    }

    // const
    // console.log(req.body)
    res.send(`200`);
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
  socket.disconnect();
};
