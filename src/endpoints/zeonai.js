const EmailHandler = require('../modules/email')
const fetch = require('node-fetch')
function aiReq () {
  return new Promise((resolve, reject) => {
    var raw = JSON.stringify({
      'model': 'gemini-pro',
      'messages': [
        {
          'role': 'user',
          'content': prompt
        }
      ]
    })

    var requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': process.env.AI_API_KEY
      },
      body: raw,
      redirect: 'follow'
    }

    fetch('https://api.acloudapp.com/v1/chat/completions', requestOptions)
        .then(response => response.json())
        .then(result => {
          // console.log(result)
          if (result.error) {
            reject(result.error.message)
          } else {
            console.log(result.choices[0].message)
            resolve(result.choices[0].message.content)
          }
        })
      //   .catch(error => console.log('error', error));
  })
}
module.exports = (router, db) => {
    router.all('/', (req,res) => res.json('Hello, world!'))
    router.post('/email', EmailHandler({ mailsignkey: process.env.EMAIL_SIGN }), (req,res) => {
        console.log(req.email)
    })
}
