const { rateLimit } = require("express-rate-limit").default;
// default template
// Slack app credentials from .env
const CLIENT_ID = process.env.SLACK_CLIENT_ID;
const CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const REDIRECT_URI = process.env.SLACK_REDIRECT_URI;
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
  router.get("/slack/oauth", (req, res) => {
    const slackAuthURL = `https://hackclub.slack.com/oauth?client_id=${CLIENT_ID}&scope=&user_scope=chat%3Awrite%2Cim%3Awrite%2Cusers%3Aread%2Cusers%3Aread.email&redirect_uri=${REDIRECT_URI}&state=&granular_bot_scope=1&single_channel=0&install_redirect=oauth&tracked=1&team=1`;
    res.redirect(slackAuthURL);
  });

  // Step 2: Handle OAuth callback from Slack
  router.get("/slack/oauth/callback", async (req, res) => {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("No code provided.");
    }

    try {
      // Exchange the code for an access token
      const response = await axios.post(
        "https://slack.com/api/oauth.v2.access",
        null,
        {
          params: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            redirect_uri: REDIRECT_URI,
          },
        },
      );

      if (response.data.ok) {
        const { access_token, team } = response.data;
        res.send(
          `OAuth successful! Team: ${team.name}, Access Token: ${access_token}`,
        );
      } else {
        res.status(400).send(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Error during OAuth:", error.message);
      res.status(500).send("Internal Server Error");
    }
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
