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

      //      res.send("Slack OAuth completed successfully!");
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).send("OAuth callback error");
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
  router.get("/delete_user_data", async (req, res) => {
    if (req.query.a == process.env.SLACK_ZEON_AUTH) {
      db.delete("user_" + req.query.userId);
      res.status(200).json({
        status: 200,
        message: "User data deleted",
      });
    } else {
      res.status(401).json({
        status: 401,
        message: "Unauthorized",
      });
    }
  });
  router.post(
    "/send_vote",
    rateLimit({ windowMs: 5000, limit: 3 }),
    async (req, res) => {
      // todo check if the user has been authed with me
      if (!req.headers["x-user-id"]) {
        return res.status(401).json({
          status: 401,
          message: "Unauthorized",
        });
      }

      const user = await db.get("user_" + req.headers["x-user-id"]);
      if (!user) {
        return res.status(401).json({
          status: 401,
          message: "Unauthorized",
        });
      }
      let body = req.body;
      if (body.anon) {
        body.userId = `Anon`;
      } else {
        body.userId = req.headers["X-User-Id"] || req.headers["x-user-id"];
      }
      // const ship = ((await db.get("ships")) || []).find(
      //   (s) => s.repo === body.repo || s.demo === body.demo,
      // );
      const ship = {
        repo: body.repo,
        demo: body.demo,
        userId: body.author,
        title: body.title,
        // in v0.0.3 it will show the matchup it is against, and it will be shared :P
        matchup_against: body.matchup_against,
      };

      // good news, we dont need the db :P, data will be kept for the sillies :3
      // if (!ship)
      //   return res.status(400).json({
      //     message: `Ship not found x.x`,
      //   });
      console.log(user, body, ship);
      await client.chat.postMessage({
        text: ` \nVote written by ${
          body.userId == "Anon" ? `Anon` : `<@${user.id}>`
        } for *${ship.title}* by <@${ship.userId}>${ship.matchup_against ? ` against *${ship.matchup_against}*` : ""}\n\`\`\`${body.vote.replace(
          /`/,
          String.fromCharCode(8203),
        )}\`\`\``,
        channel: `C0833U384G2`,
      });
      if (body.send_it_to_user && body.userId !== "Anon") {
        const uclient = new webclient.WebClient(user.token);
        // open that dm first!
        const responseeeee = await uclient.conversations.open({
          users: ship.userId,
        });
        await uclient.chat.postMessage({
          text: `Hey! i voted for your ship!\n\`\`\`${body.vote}\`\`\`\n_Sent via <#C0833U384G2>_`,
          channel: responseeeee.channel.id,
        });
      } else if (body.send_it_to_user && body.userId === "Anon") {
        // #ifthisgetsabusedimacry
        client.chat.postMessage({
          text: `Hey! an anon user voted for your ship and _really_ wanted to tell you about it!!\n\`\`\`${body.vote}\`\`\`\n\n if this was spammed to you please dm screenshots to @Neon asap!!\n_Sent via <#C0833U384G2>_`,
          channel: ship.userId,
        });
      }
    },
  );
  // also anaylticsbody.send_it_to_user &&  body.userId !== "Anon"
  // uhh i dont need this if there in a channel smh
};
module.exports.socket_handle = (socket) => {
  socket.on("query ship", async (data) => {
    // find the ship in the db
    const ship = (await db.get("ships")).find(
      (s) => s.repo === data.repo && s.demo === data.demo,
    );
  });
};
