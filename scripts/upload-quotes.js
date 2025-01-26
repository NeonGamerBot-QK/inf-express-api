const quotes = require("../quotes.json").map(
  (q) => `"${q.quote}" - ${q.author}`,
);

require("dotenv").config();

fetch("https://api.saahild.com/api/quotesdb/add", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: process.env.IMESSAGE_TOKEN,
  },
  body: JSON.stringify(quotes),
})
  .then((r) => r.json())
  .then(console.log);
