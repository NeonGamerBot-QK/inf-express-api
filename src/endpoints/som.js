const { rateLimit } = require("express-rate-limit").default;
// default template
// Slack app credentials from .env
const CLIENT_ID = process.env.SLACK_CLIENT_ID;
const CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const REDIRECT_URI = process.env.SLACK_REDIRECT_URI;
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
          res.send(`Done! you may close this tab.`);
        },
      });
      console.log("OAuth response:", response, req.session);
      // await slackInstaller.authorize({ })

           res.send("Slack OAuth completed successfully! please copy and paste this xoxp: "+ response.accessToken);
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).send("OAuth callback error");
    }
  });
}