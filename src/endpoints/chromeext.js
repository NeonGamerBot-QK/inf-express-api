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
  router.get("/dashboard-client", async (req, res) => {
    const clientId = req.query.client || 0;
    const clients = (await db.get("clients")) || [];
    const clientInfo = clients[clientId] || {};
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Client Stats Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f5f5f5; }
    h2 { margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; background: #fff; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #eee; cursor: pointer; }
    .alert { color: red; font-weight: bold; }
    .feature { display: inline-block; margin-right: 10px; padding: 4px 8px; background: #ddd; border-radius: 4px; }
    .feature.active { background: #4caf50; color: white; }
    .charts { display: flex; gap: 40px; flex-wrap: wrap; }
    canvas { background: #fff; border-radius: 8px; padding: 10px; }
    #tab-search { margin-bottom: 10px; padding: 5px; width: 300px; }
  </style>
</head>
<body>
  <h1>Client Stats Dashboard</h1>

  <h2>CPU</h2>
  <p>Model: <span id="cpu-model"></span></p>
  <p>Architecture: <span id="cpu-arch"></span></p>
  <p>Average Usage: <span id="cpu-usage"></span>%</p>
  <div id="cpu-alert" class="alert"></div>
  <div id="cpu-features"></div>
  <canvas id="cpu-chart" width="400" height="150"></canvas>

  <h2>Memory</h2>
  <p>Used: <span id="mem-used"></span> / Total: <span id="mem-total"></span></p>
  <div id="mem-alert" class="alert"></div>
  <canvas id="mem-chart" width="200" height="200"></canvas>

  <h2>Storage</h2>
  <div id="storage-alert" class="alert"></div>
  <canvas id="storage-chart" width="200" height="200"></canvas>

  <h2>Browser Tabs</h2>
  <input type="text" id="tab-search" placeholder="Search tabs...">
  <table id="tabs-table">
    <thead>
      <tr><th>Title</th><th>URL</th><th>Active</th><th>Pinned</th><th>Last Accessed</th></tr>
    </thead>
    <tbody></tbody>
  </table>

  <script>
    const data = ${JSON.stringify(clientInfo)}; // Replace with your JSON

    // Helpers
    const toGB = b => (b / (1024**3)).toFixed(2) + ' GB';
    const formatTime = ms => new Date(ms).toLocaleString();

    // CPU
    document.getElementById('cpu-model').textContent = data.stats.cpu.modelName;
    document.getElementById('cpu-arch').textContent = data.stats.cpu.archName;
    const cpuUsages = data.stats.cpu.processors.map(p => (1 - p.usage.idle / p.usage.total) * 100);
    const avgCpuUsage = cpuUsages.reduce((a,b)=>a+b,0)/cpuUsages.length;
    document.getElementById('cpu-usage').textContent = avgCpuUsage.toFixed(2);
    if (avgCpuUsage > 80) document.getElementById('cpu-alert').textContent = "High CPU usage! ⚠️";

    // CPU Features
    const featuresDiv = document.getElementById('cpu-features');
    data.stats.cpu.features.forEach(f => {
      const span = document.createElement('span');
      span.textContent = f;
      span.className = 'feature active';
      featuresDiv.appendChild(span);
    });

    // CPU chart per core
    new Chart(document.getElementById('cpu-chart'), {
      type: 'bar',
      data: {
        labels: cpuUsages.map((_,i)=>\`Core \${i+1}\`),
        datasets: [{ label: 'CPU Usage %', data: cpuUsages, backgroundColor: cpuUsages.map(u=>u>80?'red':'#4caf50') }]
      },
      options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });

    // Memory
    const memUsed = data.stats.memory.capacity - data.stats.memory.availableCapacity;
    document.getElementById('mem-used').textContent = toGB(memUsed);
    document.getElementById('mem-total').textContent = toGB(data.stats.memory.capacity);
    if (data.stats.memory.availableCapacity < 1024*1024*1024) document.getElementById('mem-alert').textContent = "Low memory! ⚠️";

    // Memory pie chart
    new Chart(document.getElementById('mem-chart'), {
      type: 'pie',
      data: {
        labels: ['Used', 'Available'],
        datasets: [{ data: [memUsed, data.stats.memory.availableCapacity], backgroundColor: ['#4caf50','#ddd'] }]
      }
    });

    // Storage chart
    const storageLabels = data.stats.storage.map(s=>s.name);
    const storageData = data.stats.storage.map(s=>s.capacity);
    new Chart(document.getElementById('storage-chart'), {
      type: 'pie',
      data: { labels: storageLabels, datasets: [{ data: storageData, backgroundColor: storageData.map(c=>c>0.9*Math.max(...storageData)?'red':'#2196f3') }] }
    });
    data.stats.storage.forEach(s=>{ if(s.capacity/1024**3 > 200) document.getElementById('storage-alert').textContent = "Storage nearly full! ⚠️"; });

    // Tabs
    const tabsTbody = document.querySelector('#tabs-table tbody');
    function renderTabs(filter='') {
      tabsTbody.innerHTML = '';
      data.tabs.filter(t => t.title.toLowerCase().includes(filter.toLowerCase())).forEach(t => {
        const row = tabsTbody.insertRow();
        row.insertCell(0).textContent = t.title;
        row.insertCell(1).textContent = t.url;
        row.insertCell(2).textContent = t.active;
        row.insertCell(3).textContent = t.pinned;
        row.insertCell(4).textContent = formatTime(t.lastAccessed));
      });
    }
    renderTabs();
    document.getElementById('tab-search').addEventListener('input', e => renderTabs(e.target.value));

  </script>
</body>
</html>

`);
  });
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
