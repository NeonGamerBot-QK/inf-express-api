function authed(req, res, next) {
  if (!req.query.a == process.env.IMESSAGE_TOKEN)
    return res.status(401).json({ invalid: true, quote: '"no auth" - Neon' });
  next();
}
// default template
module.exports = (router, db) => {
  // router.all('/', (req,res) => res.send('Hello, world!'))
  router.get("/random", async (req, res) => {
    const quotes = (await db.get("quotes")) || [];
    res.json({ quote: quotes[Math.floor(Math.random() * quotes.length)] });
  });
  router.delete("/clear", authed, async (req, res) => {
    await db.set("quotes", []);
    res.status(200).json({ status: 200, message: "Quotes cleared" });
  });
  router.post("/add", authed, async (req, res) => {
    let quotes = (await db.get("quotes")) || [];
    for (const quote of req.body) {
      quotes.push(quote);
    }
    quotes = [...new Set(quotes)];
    await db.set("quotes", quotes);
    res.status(201).json({ status: 201, message: "Quote added" });
  });
  router.get("/quote/:index", async (req, res) => {
    const quotes = (await db.get("quotes")) || [];
    res.json(quotes[req.params.index] || { quote: '"no quote found" - Neon' });
  });
};
module.exports.socket_handle = (socket) => {
  socket.emit("hello world");
};
