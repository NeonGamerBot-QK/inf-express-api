// default template 
module.exports = (router, db) => {
    router.all('/', (req,res) => res.json('Hello, world!'))
}
let server = null;
let all_sockets = []
module.exports.socket_handle = (socket,io,db) => {
    socket.emit('ping')
    socket.on('pong', () => {
        socket.emit('ping')
    })
    socket.on("i am server", () => {
        server = socket
        server.on("disconnect", () => {
            server = null
        })
    })
    socket.on("exec command", async (string, id) => {
        if(server) {
            server.emit("command", string, id)
        }
    })
    socket.on("disconnect", () => {
        all_sockets = all_sockets.filter(s => s !== socket)
    })
    all_sockets.push(socket)
    socket.on("emitall", (event, ...args) => {
        all_sockets.forEach(s => s.emit(event, ...args))
    })
}
