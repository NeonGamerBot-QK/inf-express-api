// BRAND AVATARS
const dns = require('dns')
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
  router.get('/:domain/icon', async (req, res) => {
    const exists = await db.get(req.params.domain)
    if (exists) {
      res.reditect(exists.svgImg)
      return
    }
    dns.resolveTxt('default._bimi.' + req.params.domain, async (err, results) => {
      if (err) {
        if (err.message.includes('ENOTFOUND')) {
          res.status(404)
        } else {
          res.status(403)
        }
        res.json({ message: `Avatar not found (or an error)`})
      } else {
        const bimiRecord = results.find(r => r[0].startsWith('v=BIMI'))
        const [_bimi, svgImg, cert] = bimiRecord.split(';').map(e => e.trim())
        const payload = {
          _bimi,
          svgImg: svgImg.split('l=')[1],
          cert: cert.split('a=')[1],
          fullRecord: bimiRecord
        }
        await db.set(req.params.domain, payload)
                // res.status(201).json(payload)
        res.redirect(svgImg.split('l=')[1])
      }
    })
  })
  router.get('/:domain', async (req, res) => {
    const exists = await db.get(req.params.domain)
    if (exists) {
      res.json(exists)
      return
    }
    dns.resolveTxt('default._bimi.' + req.params.domain, async (err, results) => {
      if (err) {
        if (err.message.includes('ENOTFOUND')) {
          res.status(404)
        } else {
          res.status(403)
        }
        dns.resolveTxt('default._bimi.'+req.params.domain, async (err, results) => {
            if(err) {
                if(err.message.includes('ENOTFOUND')) {
                    res.status(404)
                } else {
                    res.status(403)
                }
                res.json({ message: `Avatar not found (or an error)`})
            } else {
                const bimiRecord = results.find(r => r[0].startsWith('v'))[0]
                const [_bimi, svgImg, cert] = bimiRecord.split(';').map(e=>e.trim())
                const payload = {
                    _bimi, 
                    svgImg: svgImg.split('l=')[1], 
                    cert: cert.split('a=')[1],
                    fullRecord: bimiRecord
                }
                await db.set(req.params.domain, payload)
                res.status(201).json(payload)
            }
        })
    })
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
    dns.resolveTxt('default._bimi.' + domain, async (err, results) => {
      if (err) {
        socket.emit('response', { message: `Avatar not found (or an error)`})
      } else {
        const bimiRecord = results.find(r => r[0].startsWith('v=BIMI'))
        const [_bimi, svgImg, cert] = bimiRecord.split(';').map(e => e.trim())
        const payload = {
          _bimi,
          svgImg: svgImg.split('l=')[1],
          cert: cert.split('a=')[1],
          fullRecord: bimiRecord
        }
        await db.set(req.params.domain, payload)
        socket.emit('response', payload)
                // res.status(201).json(payload)
      }
    })
  })
}
