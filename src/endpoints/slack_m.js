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
      const m = await uclient.chat.postMessage(req.body);
      res.json({ message: "OK", sent_message: m });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e.message,
      });
    }
  });
  // uhh im just lazy
  router.get("/pronouns", async (req, res) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ message: `no token` });

    const uclient = new webclient.WebClient(token);
    const fp = await db.get("cache_p" + req.query.user);

    if (fp && Date.now() - fp.expires < 0) {
      return res.json({
        message: "OK CACHE",
        pronouns: fp.pronouns,
      });
    }
    try {
      const m = await uclient.users.profile.get({
        user: req.query.user,
      });
      await db.set("cache_p" + req.query.user, {
        expires: Date.now() + 60_000,
        user: req.query.user,
        pronouns: m.profile.pronouns,
      });
      res.json({ message: "OK", pronouns: m.profile.pronouns });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: e.message,
      });
    }
  });
};
