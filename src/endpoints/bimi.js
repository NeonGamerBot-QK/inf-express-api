// BRAND AVATARS
// const dns = require('dns')

module.exports = (router, db) => {
// func
const queryForDomain = async (domain) => {
  let out = require('child_process').execSync(`dig TXT +short default._bimi.${domain}`).toString()
  if (!out) return 'bad-query'
  out = out.replaceAll('"', '')
  if (!out.startsWith('v=BIMI')) return 'bad-query'
  const bimiRecord = out;
  const [_bimi, svgImg, cert] = bimiRecord.split(';').map(e => e.trim())
  const payload = {
    _bimi,
    svgImg: svgImg.split('l=')[1],
    cert: cert.split('a=')[1],
    fullRecord: bimiRecord
  }
  await db.set(domain, payload)
  return payload;
}
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
  router.get('/:domain/icon', async (req, res) => {
    const exists = await db.get(req.params.domain)
    if (exists) {
      res.redirect(exists.svgImg)
      return
    }
    const r = await queryForDomain(req.params.domain)
    switch (r) {
      case 'bad-query':
        res.status(404).json({ message: `Avatar not found` })
        break;
      default:
        res.redirect(r.svgImg)
      break;
    }
  })
  router.get('/:domain', async (req, res) => {
    const exists = await db.get(req.params.domain)
    if (exists) {
      res.json(exists)
      return
    }
    const r = await queryForDomain(req.params.domain)
    switch (r) {
      case 'bad-query':
        res.status(404).json({ message: `Avatar not found` })
        break;
      default:
        res.status(201).json(r)
      break;
    }
  })
}
module.exports.socket_handle = (socket, io, db) => {
  socket.emit('ready_to_serve')
  socket.on('query', async (domain) => {
        // socket.emit('ping')
    console.log(domain)
    const exists = await db.get(domain)
    if (exists) {
            // res.json(exists)
      socket.emit('response', exists)
      return
    }
    const r = await queryForDomain(req.params.domain)
    switch (r) {
      case 'bad-query':
        socket.emit('response', { message: `Avatar not found` })
        break;
      default:
        socket.emit('response', r)
      break;
    }
  })
}
