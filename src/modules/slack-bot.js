module.exports = class SlackBot {
  constructor(token, verify) {
    this.config = {
      token,
      verify,
    };
    this.token = token;
    this.verify = verify;
  }
  authMiddleware(req, res, next) {
    if (req.body.token !== this.verify) {
      res.status(401).send("Unauthorized");
      return;
    }
    next();
  }
  eventMiddleware(req, res, next) {
    req.event = req.body.event;
    next();
  }
  makeRequest(url, method, data) {
    console.debug(url, method, data);
    return fetch(`https://slack.com/api${url}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
      },
      method,
      body: JSON.stringify(data),
    });
  }
};
