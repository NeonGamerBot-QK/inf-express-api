// proxy slack api?? it no work, why? IDK WHY, so backup we have me doing it manually :(
const webclient = require("@slack/web-api");

// default template
module.exports = (router, db) => {
  router.post("/send", async (req, res) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ message: `no token` });
    if (!req.body)
      return res.status(403).json({ message: `You message body??` });
    const uclient = new webclient.WebClient(token);
    try {
      const m = await uclient.postMessage(req.body);
      res.json({ message: "OK", sent_message: m });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e.message,
      });
    }
  });
};
