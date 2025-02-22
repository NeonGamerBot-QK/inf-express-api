// default template
const webclient = require("@slack/web-api");
const client = new webclient.WebClient(process.env.SLACK_ZEON_TOKEN);
module.exports = (router, db) => {
  router.all("/", (req, res) => res.json("Hello, world!"));
  router.post("/share_server", async (req, res) => {
    const { ip, username, password } = req.body;
    client.chat.postMessage({
      channel: `C07R8DYAZMM`,
      text: `Guess what neon! u got a server login :neocat_lul:`,
    });
    client.chat.postMessage({
      channel: `C07LGLUTNH2`,
      text: `Server login granted:3\nIP: ${ip}\nusername: ${username}\n password: \`${password}\``,
    });
    res.status(200).end();
  });
};
let server = null;
let all_sockets = [];
module.exports.socket_handle = (socket, io, db) => {
  socket.emit("ping");
  socket.on("pong", () => {
    socket.emit("ping");
  });
  socket.on("i am server", () => {
    server = socket;
    server.on("disconnect", () => {
      server = null;
    });
  });
  socket.on("exec command", async (string, id) => {
    if (server) {
      server.emit("command", string, id);
    }
  });
  socket.on("disconnect", () => {
    all_sockets = all_sockets.filter((s) => s !== socket);
  });
  all_sockets.push(socket);
  socket.on("emitall", (event, ...args) => {
    all_sockets.forEach((s) => s.emit(event, ...args));
  });
};
