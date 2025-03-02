const Stripe = require("stripe").Stripe;
const sclient = new Stripe(process.env.ECHOS_TOKEN);

module.exports = (router, db) => {
  router.get("/pay", async (req, res) => {
    const paymentLink = await sclient.paymentLinks.create({
      line_items: [
        {
          price: "prod_Rrjw0rKdiZ2v3I",
          quantity: 1,
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
