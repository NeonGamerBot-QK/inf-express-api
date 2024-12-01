const { rateLimit } = require("express-rate-limit").default;
// default template 
module.exports = (router, db) => {
    router.all('/', (req,res) => res.json({
        message: "hi"
    }))
// my endpoint only
    router.post('/mass_add_ships', (req,res) => {
        if(req.headers.authorization !== process.env.SLACK_ZEON_AUTH) {
            return res.status(401).json({
                status: 401,
                message: "Unauthorized"
            })
        }
        const ships = req.body
        db.set('ships', ships)
        res.json({
            status: 200,
            message: "Ships added"
        })
    })
    router.post('/add_ship', async (req,res) => {
        if(req.headers.authorization !== process.env.SLACK_ZEON_AUTH) {
            return res.status(401).json({
                status: 401,
                message: "Unauthorized"
            })
        }
        const ship = req.body
    const oldships = await db.get('ships')
        db.set('ships', oldships.concat(ship))
        res.json({
            status: 200,
            message: "Ship added"
        })
})
router.get('/get_ship', async (req,res) => {
    const repoURL = req.query.repo
    const demoURL = req.query.demo

const ship = (await db.get('ships')).find(s =>s.repo === repoURL || s.demo === demoURL)
res.json({
    status: 200,
    message: ship
})
})
//todo slack oauth2 :heavysob:
// also anayltics
// ratelimits
// 
}
module.exports.socket_handle = socket => {
socket.on('query ship', async (data) => {
// find the ship in the db
const ship = (await db.get('ships')).find(s =>s.repo === data.repo && s.demo === data.demo)
})
}
