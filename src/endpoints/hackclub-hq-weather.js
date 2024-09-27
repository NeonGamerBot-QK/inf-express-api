const SlackBot = require("../modules/slack-bot");
// addr 52 Shelburne Museum, Shelburne, VT 05482, United States
// zip code: 05482
const hckHQLocation = "05482";
// default template
module.exports = (router, db) => {
  //router.get("/");
  const slackInstance = new SlackBot(
    process.env.WEATHER_SLACK_BOT_SECRET,
    process.env.WEATHER_SLACK_VERIFICATION,
  );
  async function sendWeather() {
    const weatherData = await fetch(
      `http://api.weatherapi.com/v1/current.json?q=${hckHQLocation}&key=${process.env.WEATHER_API_KEY}`,
    ).then((res) => res.json());
    function formatStr(str) {
      Object.keys(weatherData.current).forEach((key) => {
        str = str.replace(
          `{current.${key}}`,
          weatherData.current[key].toString(),
        );
      });
      Object.keys(weatherData.location).forEach((key) => {
        str = str.replace(
          `{location.${key}}`,
          weatherData.location[key].toString(),
        );
      });
      return str;
    }
    const payload = {
      blocks: [
        {
          type: "image",
          title: {
            type: "plain_text",
            text: weatherData.current.condition.text,
            emoji: true,
          },
          image_url: weatherData.current.condition.icon,
          alt_text: weatherData.current.condition.text,
        },
        {
          type: "header",
          text: {
            type: "plain_text",
            text: formatStr("{location.name} - {location.region}"),
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: formatStr("Temp: {current.temp_f} ({current.temp_c})"),
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: formatStr(
              "Feels Like: {current.feelslike_f} ({current.feelslike_c})",
            ),
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: formatStr("Wind: {current.wind_mph} ({current.wind_kph})"),
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: formatStr("Gust: {current.gust_mph} ({current.gust_kph})"),
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: formatStr(
              "Wind: {current.windchill_f} ({current.windchill_c})",
            ),
          },
        },
        {
          type: "divider",
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Weather on accuweather",
                emoji: true,
              },
              url: "https://www.accuweather.com/en/us/shelburne/05482/weather-forecast/2184925?city=shelburne",
            },
          ],
        },
      ],
    };
    return slackInstance.makeRequest(`/chat.postMessage`, "POST", {
      ...payload,
      channel: "C0P5NE354",
    });
  }
  setInterval(
    () => {
      console.log("pinging");
      sendWeather();
    },
    60 * 60 * 1000,
  );
  router.all("/info", (req, res) => {
    // console.debug(req.body);
    res.send("wsp this is a wip atm");
  });

  router.post("/weather", async (req, res) => {
    const weatherData = await fetch(
      `http://api.weatherapi.com/v1/current.json?q=${hckHQLocation}&key=${process.env.WEATHER_API_KEY}`,
    ).then((res) => res.json());
    function formatStr(str) {
      Object.keys(weatherData.current).forEach((key) => {
        str = str.replace(
          `{current.${key}}`,
          weatherData.current[key].toString(),
        );
      });
      Object.keys(weatherData.location).forEach((key) => {
        str = str.replace(
          `{location.${key}}`,
          weatherData.location[key].toString(),
        );
      });
      return str;
    }
    res.set("Content-Type", "application/json");
    res.json({
      blocks: [
        {
          type: "image",
          title: {
            type: "plain_text",
            text: weatherData.current.condition.text,
            emoji: true,
          },
          image_url: weatherData.current.condition.icon,
          alt_text: weatherData.current.condition.text,
        },
        {
          type: "header",
          text: {
            type: "plain_text",
            text: formatStr("{location.name} - {location.region}"),
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: formatStr("Temp: {current.temp_f} ({current.temp_c})"),
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: formatStr(
              "Feels Like: {current.feelslike_f} ({current.feelslike_c})",
            ),
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: formatStr("Wind: {current.wind_mph} ({current.wind_kph})"),
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: formatStr("Gust: {current.gust_mph} ({current.gust_kph})"),
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: formatStr(
              "Wind: {current.windchill_f} ({current.windchill_c})",
            ),
          },
        },
        {
          type: "divider",
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Weather on accuweather",
                emoji: true,
              },
              url: "https://www.accuweather.com/en/us/shelburne/05482/weather-forecast/2184925?city=shelburne",
            },
          ],
        },
      ],
    });
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
      // console.log(req.body);
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
        token: process.env.WEATHER_SLACK_BOT_SECRET, // ffs slack
      })
      .then((res) => res.text());
    //.then(console.log);
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
