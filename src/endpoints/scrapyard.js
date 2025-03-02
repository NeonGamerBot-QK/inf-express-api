const Stripe = require("stripe").Stripe;
const sclient = new Stripe(process.env.ECHOS_TOKEN);

module.exports = (router, db) => {
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
    res.redirect(paymentLink);
  });
  router.get("/list", async (req, res) => {
    // list all price objs
    const prices = await sclient.prices.list();
    res.json(prices);
  });
};
