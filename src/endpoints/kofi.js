// default template 
module.exports = (router, db) => {
    router.post('/webhook', (req,res) => {
        const body = JSON.parse(req.body.data)
        console.log(body)
        // console.log(req.body)
        res.send(`200`)
    })
}
module.exports.socket_handle = (socket,io,db) => {
    socket.emit('ping')
    socket.on('pong', () => {
        socket.emit('ping')
    })
    socket.disconnect()
}
