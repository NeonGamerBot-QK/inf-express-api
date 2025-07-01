// default template
const webclient = require("@slack/web-api");
const client = new webclient.WebClient(process.env.SLACK_ZEON_TOKEN);
module.exports = (router, db) => {
  router.get("/", (req, res) => {
    res.json({
      message: "Welcome to the Loubugger API",
      version: "0.0.1",
    });
  });
  router.post("/free_noise", async (req, res) => {
    // return res.status(402).send("Payment Required");
    try {
      await client.conversations.invite({
        channel: `C094KL52E8G`,
        users: `U06EMBJH71S`,
      });
      await client.chat.postMessage({
        channel: `C094KL52E8G`,
        text: `lou tried to escape :pensive:`,
      });
    } catch (e) {}
    await client.chat.postMessage({
      channel: `C094KL52E8G`,
      text: `free boop <@U06EMBJH71S>`,
    });
  });
};
