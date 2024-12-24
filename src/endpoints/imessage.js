// they are not secret lol
const forwardUrls = [
  "https://slack.mybot.saahild.com/imessage",
  "https://mybot.saahild.com/irl/imessage",
];
// default template
module.exports = (router, db) => {
  router.use((req, res, next) => {
    if (req.headers["x-imessage-token"] !== process.env.IMESSAGE_TOKEN)
      return res.status(401).json({
        invalid: true,
      });
    next();
  });
  router.get("/messages_to_send", async (req, res) => {
    res.json((await db.get(`messages_to_send`)) || []);
  });
  router.post(`/send_message`, async (req, res) => {
    const oldInstance = (await db.get(`messages_to_send`)) || [];
    oldInstance.push(req.body);
    db.set(`messages_to_send`, oldInstance);
    res.status(201).json({
      status: 201,
      message: `Message sent`,
    });
  });
  // yes
  router.post(`/receive`, async (req, res) => {
    const oldInstance = (await db.get(`messages_recived`)) || [];
    oldInstance.push(req.body);
    db.set(`messages_recived`, oldInstance);
    for (let i = 0; i < forwardUrls.length; i++) {
      fetch(forwardUrls[i], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-imessage-token": process.env.IMESSAGE_TOKEN,
        },
        body: JSON.stringify(req.body),
      }).catch((e) => {});
    }
    res.status(200).end();
  });
  router.get(`/messages_recived`, async (req, res) => {
    res.json((await db.get(`messages_recived`)) || []);
  });
  router.delete("/clear_messages_to_send", async (req, res) => {
    db.set(`messages_to_send`, []);
    res.status(200).json({
      status: 200,
      message: `Messages cleared`,
    });
  });
};
module.exports.socket_handle = (socket) => {
  socket.disconnect();
};
