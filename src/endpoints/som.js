const { rateLimit } = require("express-rate-limit").default;
// default template
// Slack app credentials from .env
const CLIENT_ID = process.env.SLACK_CLIENT_ID;
const CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const REDIRECT_URI = process.env.SLACK_REDIRECT_URI;
/**
 * @typedef {Object}VoteBody
 * @property {string} message - The message to vote on
 * @property {boolean} send_it_to_user
 * @property {boolean} anon
 * @property {string} repo_url
 * @property {string} demo_url
 * @property {string} title
 * @property {string} author
 * @property {string} a_repo_url
 * @property {string} a_demo_url
 * @property {string} a_title
 * @property {string} a_author
 * @property {boolean} is_tie
 *
 */
const { InstallProvider } = require("@slack/oauth");
module.exports = (router, db) => {
  const webclient = require("@slack/web-api");
  const client = new webclient.WebClient(process.env.SLACK_ZEON_TOKEN);
  const slackInstaller = new InstallProvider({
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    stateVerification: false,
    // stateSecret: "random-secret-", // Use a secure random string
    redirectUri: process.env.SLACK_REDIRECT_URI,
  });

  router.get("/slack/oauth", async (req, res) => {
    try {
      const state = "random-secret-";
      const url = await slackInstaller.generateInstallUrl(
        {
          scopes: [],

          // state: state,
          // scopes: ["chat:write", "im:write", "users:read", "users:read.email"], // Update with your required scopes
          userScopes: [
            "chat:write",
            "im:write",
            "users:read",
            "users:read.email",
          ], // Optional, for user token scopes
        },
        false,
      );
      res.redirect(url);
    } catch (error) {
      console.error("Error generating install URL:", error);
      res.status(500).send("Error generating install URL");
    }
  });

  // Route to handle OAuth callback
  router.get("/slack/oauth/callback", async (req, res) => {
    try {
      const { code } = req.query;
      const response = await slackInstaller.handleCallback(req, res, {
        afterInstallation: async (r) => {
          console.log(r);
          await db.set("user_" + r.user.id, r.user);
         res.send(
        "Slack OAuth completed successfully! please copy and paste this xoxp: " +
          response.accessToken,
      );
        },
      });
      console.log("OAuth response:", response, req.session);
      // await slackInstaller.authorize({ })

      res.send(
        "Slack OAuth completed successfully! please copy and paste this xoxp: " +
          response.accessToken,
      );
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).send("OAuth callback error");
    }
  });
  router.post(
    "/vote",
    rateLimit({ windowMs: 5000, limit: 3 }),
    async (req, res) => {
      //  res.send("hey uhh this isnt done yet....");
      // user token from headers
      const userToken = req.headers["authorization"];
      if (!userToken) {
        return res.status(401).send("Unauthorized");
      }
      // find user token in db
      const user = await db.get("user_" + userToken);
      if (!user) {
        return res.status(401).send("Unauthorized");
      }

      // get the message from the body
      /**
       * @type {VoteBody}
       */
      const body = req.body;
      if (!body || !body.message) {
        return res.status(400).send("Bad Request: Missing message");
      }
      // get user token via there token lol
      const userClient = new webclient.WebClient(userToken);
      const userInfo = await userClient.users.identity();
      let userStringPing = `<@${userInfo.user.id}>`;
      if (body.anon) {
        // send a nice msg to zeon
        userStringPing = "Anon";
      }
      client.chat.postMessage({
        channel: `C093B1Q2E6P`,
        text: `dumpy because yes:\n${JSON.stringify(req.body)}\n\n${JSON.stringify(req.headers)}\n\n${JSON.stringify(userInfo)}`,
      });

      client.chat.postMessage({
        channel: `C091KC99S3C`,
        text: `New vote by ${userStringPing} for ${body.is_tie ? `a TIE between ${body.title} and ${body.a_title}` : `*${body.title}* which won against *${body.a_title}*`}.\n\`\`\`\n${body.message}\`\`\``,
      });
      if (body.send_it_to_user) {
        // TODO: i dont have the user ID yet fuuuu
      }

      res.status(201).send({
        message: "Vote received successfully! Thanks for voting!",
        user: userInfo.user,
        // body: body,
        // headers: req.headers
      });
    },
  );
};
