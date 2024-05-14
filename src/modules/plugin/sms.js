// plugin for ../email_client.js
module.exports = class SmsPlugin {
  init (raw, me) {
    if (raw.attachments[0].fileName === 'text_0.txt') {
            // its a txt
      const att = raw.attachments.shift()
      let str = Buffer.from(att.data, 'base64').toString()
      me.body = str
    }
  }
  sendMail () {

  }
}
