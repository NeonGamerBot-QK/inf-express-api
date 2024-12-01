const { rateLimit } = require("express-rate-limit").default;
// default template
module.exports = (router, db) => {
  const webclient = require("@slack/web-api");
  const client = new webclient.WebClient(process.env.SLACK_ZEON_TOKEN);
  router.all("/", (req, res) =>
    res.json({
      message: "hi",
    }),
  );
  // my endpoint only
  router.post("/mass_add_ships", (req, res) => {
    if (req.headers.authorization !== process.env.SLACK_ZEON_AUTH) {
      return res.status(401).json({
        status: 401,
        message: "Unauthorized",
      });
    }
    const ships = req.body;
    db.set("ships", ships);
    res.json({
      status: 200,
      message: "Ships added",
    });
  });
  router.post("/add_ship", async (req, res) => {
    if (req.headers.authorization !== process.env.SLACK_ZEON_AUTH) {
      return res.status(401).json({
        status: 401,
        message: "Unauthorized",
      });
    }
    const ship = req.body;
    const oldships = await db.get("ships");
    db.set("ships", oldships.concat(ship));
    res.json({
      status: 200,
      message: "Ship added",
    });
  });
  router.get("/get_ship", async (req, res) => {
    const repoURL = req.query.repo;
    const demoURL = req.query.demo;

    const ship = (await db.get("ships")).find(
      (s) => s.repo === repoURL || s.demo === demoURL,
    );
    res.json({
      status: 200,
      message: ship,
    });
  });
  router.post(
    "/send_vote",
    rateLimit({ windowMs: 5000, limit: 3 }),
    async (req, res) => {
      // todo check if the user has been authed with me
      let body = req.body;
      if (body.anon) {
        body.userId = `Anon`;
      } else {
        body.userId = req.headers["X-User-Id"] || req.headers["x-user-id"];
      }
      await client.chat.postMessage({
        text: `um this is dev so just ignore this tbh\n\`\`\`${body.vote}\`\`\``,
        channel: `C0833U384G2`,
      });
    },
  );
  //todo slack oauth2 :heavysob:
  // also anayltics
  // ratelimits
  //
};
module.exports.socket_handle = (socket) => {
  socket.on("query ship", async (data) => {
    // find the ship in the db
    const ship = (await db.get("ships")).find(
      (s) => s.repo === data.repo && s.demo === data.demo,
    );
  });
};
