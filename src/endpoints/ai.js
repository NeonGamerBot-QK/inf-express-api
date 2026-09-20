const { randomUUID, randomBytes } = require("crypto");
const bcrypt = require("bcryptjs");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { requireBearer } = require("../modules/auth");

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Requires the AI master key (Bearer token) for key management routes.
 */
const authed = requireBearer("AI_MASTER_KEY");

/**
 * Requires a valid, previously-issued API key (Bearer token) for proxied
 * routes. Keys are stored as bcrypt hashes, so every request is checked
 * against each stored hash rather than a plaintext comparison.
 */
function requireApiKey(db) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const provided = authHeader.replace(/^Bearer\s+/i, "") || req.query.auth;
    if (!provided) return res.status(401).json({ error: "Unauthorized" });

    const keys = (await db.get("keys")) || [];
    for (const storedKey of keys) {
      if (await bcrypt.compare(provided, storedKey.hash)) {
        req.apiKey = storedKey;
        return next();
      }
    }
    return res.status(401).json({ error: "Unauthorized" });
  };
}

// default template
module.exports = (router, db) => {
  router.get("/", (req, res) => res.json({ message: "Hello, world!" }));

  // API key management, gated by the master key from .env (AI_MASTER_KEY)
  router.get("/keys", authed, async (req, res) => {
    const keys = (await db.get("keys")) || [];
    res.json(keys.map(({ id, label, created_at }) => ({ id, label, created_at })));
  });

  router.post("/keys", authed, async (req, res) => {
    const keys = (await db.get("keys")) || [];
    const plainKey = randomBytes(32).toString("hex");
    const newKey = {
      id: randomUUID(),
      hash: await bcrypt.hash(plainKey, BCRYPT_SALT_ROUNDS),
      label: req.body?.label || null,
      created_at: new Date().toISOString(),
    };
    keys.push(newKey);
    await db.set("keys", keys);
    // the plaintext key is only ever available in this response
    res.status(201).json({
      id: newKey.id,
      key: plainKey,
      label: newKey.label,
      created_at: newKey.created_at,
    });
  });

  router.delete("/keys/:id", authed, async (req, res) => {
    const keys = (await db.get("keys")) || [];
    const remaining = keys.filter((k) => k.id !== req.params.id);
    if (remaining.length === keys.length) {
      return res.status(404).json({ status: 404, message: "Key not found" });
    }
    await db.set("keys", remaining);
    res.status(200).json({ status: 200, message: "Key deleted" });
  });

  // Proxies all requests to the local Ollama instance, gated by a key
  // created via POST /keys
  router.use(
    "/ollama",
    requireApiKey(db),
    createProxyMiddleware({
      target: "http://10.0.0.1:11434",
      changeOrigin: true,
      pathRewrite: { "^/ollama": "" },
    }),
  );

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
};
module.exports.socket_handle = (socket) => {
  socket.emit("hello world");
};
