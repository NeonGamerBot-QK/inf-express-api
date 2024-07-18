// default template 
module.exports = (router, db) => {
    router.all('/', (req,res) => res.json('Hello, world!'))
    router.get('/curated', require('express-rate-limit').rateLimit({
        windowMs: 500, 
        limit: 2
    }), async (req,res) => {
        const queries = new URLSearchParams(req.query).toString()
      res.json(await  fetch("https://api.pexels.com/v1/curated?"+queries, {
        headers: {
            "Authorization": process.env.PEXEL_AUTH
        }
      }).then(r=>r.json()))
    })
}

//module.exports.socket_handle = (socket,io,db) => {
  //  socket.emit('ping')
 //   socket.on('pong', () => {
 //       socket.emit('ping')
  //  })
//}
