// default template 
module.exports = (router, db) => {
    router.post('/upload', (req,res) => {
        console.log(req.body)
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
