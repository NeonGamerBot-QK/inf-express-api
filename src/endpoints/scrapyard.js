const Stripe = require("stripe").Stripe;
const sclient = new Stripe(process.env.ECHOS_TOKEN);
const webclient = require("@slack/web-api");

module.exports = (router, db) => {
      router.get('/healthcheck', async (req,res) => {
try {
    await db.set(Date.now().toString().slice(0,4), 1)
    await db.get(Date.now().toString().slice(0,4))
    await db.delete(Date.now().toString().slice(0,4))
            res.send({
            status: 200,
            message: 'OK',
        })
} catch (e) {
    res.status(500).send({ message: e.message })
}
    })
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
    // oh wow someone actually spent 10$ on ts
    // pm0
    console.log(req.body, `ts pmo`);
  });
};
