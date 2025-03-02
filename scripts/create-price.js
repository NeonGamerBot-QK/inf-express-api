const Stripe = require("stripe").Stripe;
const sclient = new Stripe(process.env.ECHOS_TOKEN);

const price = sclient.prices.create({
  unit_amount: 1000,
  currency: "usd",
  product_data: {
    name: "Gib money",
  },
});

price.then((p) => {
  console.log(p, `created!`);
});
