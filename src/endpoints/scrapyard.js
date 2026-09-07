const Stripe = require("stripe").Stripe;
const sclient = new Stripe(process.env.ECHOS_TOKEN);
const webclient = require("@slack/web-api");

module.exports = (router, db) => {
  router.get("/healthcheck", async (req, res) => {
    try {
      await db.set(Date.now().toString().slice(0, 4), 1);
      await db.get(Date.now().toString().slice(0, 4));
      await db.delete(Date.now().toString().slice(0, 4));
      res.send({
        status: 200,
        message: "OK",
      });
    } catch (e) {
      res.status(500).send({ message: e.message });
    }
  });
  router.get("/pay", async (req, res) => {
    const paymentLink = await sclient.paymentLinks.create({
      line_items: [
        {
          price: "price_1Qy0XnDwtWbetrx50uWeoalD",
          quantity: req.query.qty ? parseFloat(req.query.qty) : 1,
        },
      ],
      //   mode: "payment",
    });
    console.log(paymentLink);
    res.redirect(paymentLink.url);
  });
  router.get("/list", async (req, res) => {
    // list all price objs
    const prices = await sclient.prices.list();
    res.json(prices);
  });
  router.post("/oncharge", async (req, res) => {
    // Stripe webhook signature verification
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error("[scrapyard] Missing STRIPE_WEBHOOK_SECRET");
      return res.status(500).json({ error: "Webhook not configured" });
    }

    if (!sig) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    let event;
    try {
      event = sclient.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("[scrapyard] Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Process verified webhook event
    console.log("[scrapyard] Verified webhook event:", event.type);
    res.status(200).json({ received: true });
  });
};
