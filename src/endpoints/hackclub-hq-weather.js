const SlackBot = require("../modules/slack-bot");

// default template
module.exports = (router, db) => {
  //router.get("/");
  const slackInstance = new SlackBot(
    process.env.WEATHER_SLACK_BOT_SECRET,
    process.env.WEATHER_SLACK_VERIFICATION,
  );
  router.all("/info", (req, res) => {
    console.debug(req.body);
    res.send("wsp this is a wip atm");
  });
  router.post(
    "/events",
    (req, res, next) => {
      slackInstance.authMiddleware(req, res, next);
    },
    (req, res, next) => {
      slackInstance.eventMiddleware(req, res, next);
    },
    (req, res) => {
      if (!req.body) return;
      console.log(req.body);
      if (req.body.challenge) {
        res.send(req.body.challenge);
        return;
      }

      if (req.event.type === "app_home_opened") {
        handleHomeOpened(req.event);
      }
      res.send("ok");
    },
  );
  function handleHomeOpened(event) {
    const view = {
      type: "home",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Whats up nothing much here. All my weather posts are in <#C0P5NE354>",
          },
        },
      ],
    };

    slackInstance
      .makeRequest(`/views.publish`, "POST", {
        user_id: event.user,
        view,
      })
      .then((res) => res.text())
      .then(console.log);
  }
  router.use((req, res, next) => {
    res.send(`404`);
  });
  router.use((err, req, res) => {
    console.error(err.stack);
    res.send(err.message);
  });
};
module.exports.socket_handle = (socket) => {
  socket.emit("hello world");
};
