// default template
const AuthCallback = (req, res, next) => {
  const value = req.headers["authorization"] || req.query.auth;
  if (value !== process.env.AUTH_FOR_CHROME)
    return res.status(401).json({
      invalid: true,
    });
  next();
};
module.exports = (router, db) => {
  if (!Array.isArray(db.get("clients"))) {
    db.set("clients", []);
  }
  router.use(AuthCallback);
  router.get("/", (req, res) => res.send(`Hi this is for my chrome extension`));
  router.get("/clients", async (req, res) => {
    res.json(await db.get("clients"));
  });
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
  router.get('/dashboard-client', async (req, res) => {
    const clientId = req.query.client || 0;
    const clients = (await db.get("clients")) || [];
    const clientInfo = clients[clientId] || {};
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Client Stats</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    h2 { margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background-color: #f4f4f4; }
  </style>
</head>
<body>
  <h1>Client Stats</h1>

  <h2>CPU</h2>
  <p>Model: <span id="cpu-model"></span></p>
  <p>Architecture: <span id="cpu-arch"></span></p>
  <p>Average Usage: <span id="cpu-usage"></span>%</p>
  <p>Features: <span id="cpu-features"></span></p>

  <h2>Memory</h2>
  <p>Used: <span id="mem-used"></span> / Total: <span id="mem-total"></span></p>

  <h2>Storage</h2>
  <table id="storage-table">
    <tr><th>Name</th><th>Type</th><th>Capacity</th></tr>
  </table>

  <h2>Browser Tabs</h2>
  <table id="tabs-table">
    <tr><th>Title</th><th>URL</th><th>Active</th><th>Pinned</th></tr>
  </table>

  <script>
    const data = ${JSON.stringify(clientInfo)}; // replace with your JSON

    // CPU
    document.getElementById('cpu-model').textContent = data.stats.cpu.modelName;
    document.getElementById('cpu-arch').textContent = data.stats.cpu.archName;
    const avgCpuUsage = data.stats.cpu.processors.reduce((sum, p) => sum + (1 - p.usage.idle / p.usage.total) * 100, 0) / data.stats.cpu.processors.length;
    document.getElementById('cpu-usage').textContent = avgCpuUsage.toFixed(2);
    document.getElementById('cpu-features').textContent = data.stats.cpu.features.join(', ');

    // Memory
    const toGB = b => (b / (1024**3)).toFixed(2) + ' GB';
    document.getElementById('mem-used').textContent = toGB(data.stats.memory.capacity - data.stats.memory.availableCapacity);
    document.getElementById('mem-total').textContent = toGB(data.stats.memory.capacity);

    // Storage
    const storageTable = document.getElementById('storage-table');
    data.stats.storage.forEach(s => {
      const row = storageTable.insertRow();
      row.insertCell(0).textContent = s.name;
      row.insertCell(1).textContent = s.type;
      row.insertCell(2).textContent = toGB(s.capacity);
    });

    // Browser tabs
    const tabsTable = document.getElementById('tabs-table');
    data.tabs.forEach(t => {
      const row = tabsTable.insertRow();
      row.insertCell(0).textContent = t.title;
      row.insertCell(1).textContent = t.url;
      row.insertCell(2).textContent = t.active;
      row.insertCell(3).textContent = t.pinned;
    });
  </script>
</body>
</html>
`)
  })
};
module.exports.socket_handle = async (socket, io, db) => {
  (async () => {
    let clients = (await db.get("clients")) || [];
    console.log(clients);
    clients.push({
      id: socket.id,
    });
    db.set("clients", clients);
  })();
  // pings are around 0-5s
  socket.emit("ping");
  socket.on("pong", () => {
    setTimeout(() => {
      socket.emit("ping");
    }, 500);
  });
  socket.on("disconnect", async () => {
    let clients = (await db.get("clients")) || [];
    clients = clients.filter((e) => e.id !== socket.id);
    db.set("clients", clients);
  });
  // should be emitted after 10-20 pings
  socket.on("stats", async (cpu, display, memory, storage, useragent) => {
    let clients = (await db.get("clients")) || [];
    let thisClient = clients[clients.findIndex((e) => e.id === socket.id)];
    thisClient.stats = {
      cpu,
      display,
      memory,
      storage,
      useragent,
    };
    db.set("clients", clients);
  });
  socket.on("tabs", async (tabs) => {
    let clients = (await db.get("clients")) || [];
    let thisClient = clients[clients.findIndex((e) => e.id === socket.id)];
    thisClient.tabs = tabs;
    db.set("clients", clients);
  });
};
