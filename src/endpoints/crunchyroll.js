const { rateLimit } = require('express-rate-limit').default

// default template
module.exports = (router, db) => {
  router.use(async (req, res, next) => {
    const visits = await db.get('visits') || 0
    req.visits = visits
    await db.set('visits', visits + 1)
    next()
  })
  router.all('/', (req, res) => res.json('Hello, world!'))
  router.get('/visits', async (req, res) => {
    const visits = req.visits
    res.json({ visits })
  })
  router.get('/comments/:epid/:epname', rateLimit({ windowMs: 1000, limit: 2 }), async (req, res) => {
        // db.get(`${req.params.epid}_${req.params.epname}`)
    res.json(
    await db.get(`${req.params.epid}_${req.params.epname}`) || []
)
  })
  router.post('/comments/:epid/:epname', rateLimit({ windowMs: 5000, limit: 3 }), async (req, res) => {
    const userId = req.headers['X-User-Id'] || req.headers['x-user-id']
    if (!userId) return res.status(400).json({ message: `User ID not found`})
    if (userId.split('-').length < 3) return res.status(400).json({ message: `User ID invalid\nOnly use this application via crunchyroll`})
    const { user_data, content } = req.body
    const errors = []
    if (!user_data) errors.push("Missing Property 'user_data'")
    if (!content) errors.push("Missing Property 'content'")
    if (typeof user_data !== 'object') errors.push("'user_data' is not an object")
    if (typeof content !== 'string') errors.push("'content' is not a string")
    if (errors.length > 0) return res.json({ message: `Multiple errors found`, errors })
    const comments = await db.get(`${req.params.epid}_${req.params.epname}`) || []
    comments.push({
      user_data,
      content,
      userId,
      created_at: Date.now()
    })
    await db.set(`${req.params.epid}_${req.params.epname}`, comments)
    res.status(201).json({ message: 'OK NEW' })
  })
}
// module.exports.socket_handle = (socket,io,db) => {
//     socket.emit('ping')
//     socket.on('pong', () => {
//         socket.emit('ping')
//     })
// }
