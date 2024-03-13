require('dotenv').config()
const express = require('express')
const app = express()
const Keyv = require('keyv')
const KeyvGzip = require('@keyv/compress-gzip');
const endpoints = new Map()
const fs = require('fs')
const { exec } = require('child_process')
const path = require('path')
app.use(require('morgan')('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(require('helmet')())

// app.set('view engine', 'ejs')
// app.set('views', path.join(__dirname, 'views'))
app.get('/', (req, res) => {
    // res.render('index', { title: 'Hey', message: 'Hello there!'})
    res.json({ message: 'Hello, world!', status: 200 })
})
for(const file of fs.readdirSync(path.join(__dirname, 'endpoints'))) {
    let  endpoint;
    const name = file.split('.')[0] 

try {
    endpoint= require(path.join(__dirname, 'endpoints', file))
    console.log(`[${file}] Endpoint ${name} loaded successfully`)
}     catch (err) {
    console.error(`[${file}] Error loading endpoint ${name}: ${err.message}`)
    continue
}
    

    const db = new Keyv(process.env.DB_URI, { namespace: name })
    db.on('error', err => console.error(`[${name}] Connection error: ${err}`))
    const router =express()
    router.on('mount', () => {
        console.log(`[${file}] Endpoint ${name} mounted on /api/${name}`)
        })
        router.use((req, res, next) => {
            res.setHeader('X-Endpoint-Name', name)
            next()
        })
        // router.use()
    // run NON-async setup
    endpoint(router, db)
    endpoints.set(name, {
        db, name, router, endpoint
    })
  
    app.use(`/api/${name}`, router)

}
app.use((req, res, next) => {
    res.status(404).send({
        status: 404,
        error: 'Not found'
    })
})
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send({
        status: 500,
        error: 'Internal server error'
    })
})
const port = process.env.PORT || process.env.DEFAULT_PORT || process.env.SERVER_PORT ||3000
app.listen(port, () => {
    console.log(`Server listening on port ::${port}`)
    setInterval(() => {
        exec(`git pull -v`, (error, stdout) => {
            let response = error || stdout;
            if (!error) {
                if (!response.includes("Already up to date.")) {
                    // client.channels.cache
                        // .get("898041843902742548")
                        // .send(`<t:${Date.now().toString().slice(0, -3)}:f> Automatic update from GitHub, pulling files.\n\`\`\`${cap(response, 1900)}\`\`\``);
                   console.log(response)
                        setTimeout(() => {
                        process.exit();
                    }, 1000);
                }
            }
        });
    }, 30000);
})