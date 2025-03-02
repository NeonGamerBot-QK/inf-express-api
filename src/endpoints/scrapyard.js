const Stripe = require("stripe").Stripe;
const sclient = new Stripe(process.env.ECHOS_TOKEN);

module.exports = (router, db) => {
  router.get("/pay", async (req, res) => {
    const paymentLink = await sclient.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Test Product",
            },
            unit_amount: 1000, // Amount in cents (e.g., $10.00)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
    });
    res.redirect(paymentLink);
  });
};
