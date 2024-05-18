// default template 
module.exports = (router, db) => {
    if(!Array.isArray(db.get('clients'))) {
        db.set('clients', [])
    }
   router.get('/', (req,res) => res.send(`Hi this is for my chrome extension`))
   router.get('/clients', (req,res) => {
    res.json(db.get('clients'))
   })
}
module.exports.socket_handle = (socket,io,db) => {
(() => {
    let  clients = db.get('clients') || []
    clients.push({
        id: socket.id, 
    })
    db.set('clients', clients)
})()
// pings are around 0-5s
    socket.emit('ping')
    socket.on('pong', () => {
       setTimeout(() => {
        socket.emit('ping')
       }, 500)
    })
    socket.on('disconnect', () => {
        let  clients = db.get('clients') || []
        clients = clients.filter(e => e.socketId !== socket.id)
        db.set('clients', clients)
    })
    // should be emitted after 10-20 pings
    socket.on('stats', (cpu, display, memory, storage, useragent) => {
        let  clients = db.get('clients') || []
        let thisClient = clients[clients.findIndex(e => e.id === socket.id)]
        thisClient.stats = {
            cpu,
            display,
            memory, 
            storage,
            useragent
        }
        db.set('clients', clients)

    })
    socket.on('tabs', (tabs) => {
        let  clients = db.get('clients') || []
        let thisClient = clients[clients.findIndex(e => e.id === socket.id)]
        thisClient.tabs = tabs;
        db.set('clients', clients)
    })
}
