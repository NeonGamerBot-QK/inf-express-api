require('dotenv').config()
// ships ahoy
const fs = require("fs");

const data = fs.readFileSync("parsed-ships.json");


fetch("https://api.saahild.com/api/highseasships/mass_add_ships", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.SLACK_ZEON_AUTH
    },
    body: data
}).then(r=>r.json()).then(console.log)