// default template 
const AuthCallback = (req,res,next) => {
    const value = req.headers['authorization'] || req.query.auth
    if(value !== process.env.AUTH_FOR_CHROME) return res.status(401).json({ 
        invalid: true 
    })
    next()
}
module.exports = (router, db) => {
    if(!Array.isArray(db.get('clients'))) {
        db.set('clients', [])
    }
    router.use(AuthCallback)
   router.get('/', (req,res) => res.send(`Hi this is for my chrome extension`))
   router.get('/clients', async (req,res) => {
    res.json(await db.get('clients'))
   })
}
module.exports.socket_handle = async (socket,io,db) => {
(async () => {
    let  clients = await db.get('clients') || []
    console.log(clients)
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
    socket.on('disconnect', async () => {
        let  clients = await db.get('clients') || []
        clients = clients.filter(e => e.id !== socket.id)
        db.set('clients', clients)
    })
    // should be emitted after 10-20 pings
    socket.on('stats', async (cpu, display, memory, storage, useragent) => {
        let  clients = await db.get('clients') || []
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
    socket.on('tabs',async  (tabs) => {
        let  clients = await db.get('clients') || []
        let thisClient = clients[clients.findIndex(e => e.id === socket.id)]
        thisClient.tabs = tabs;
        db.set('clients', clients)
    })
}
