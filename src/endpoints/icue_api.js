// use for server API: https://www.npmjs.com/package/icue-controller
module.exports = (router, db) => {
  router.use(async (req, res, next) => {
    const visits = await db.get('visits') || 0
    req.visits = visits
    await db.set('visits', visits + 1)
    next()
  })
  router.get('/visits', (req, res) => {
    res.send({ visits: req.visits })
  })
  router.get('/fan/:id/color', (req, res) => {
    res.send({ color: db.get(`fan_${req.params.id}`) })
  })
  router.post('/fan/:id/color', (req, res) => {
    db.set(`fan_${req.params.id}`, req.body.color)
    res.send({ success: true })
  })
  router.get('/fans', (req, res) => {
    const fans = db.get('fans') || []
    res.send({ fans })
  })
  router.post('/fans', (req, res) => {
    const fans = req.body
    db.set('fans', fans)
    res.send({ success: true })
  })
}
