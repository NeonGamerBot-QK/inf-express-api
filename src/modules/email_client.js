const nodemailer = require('nodemailer')
const config = {
  auth: {
    user: '',
    pass: process.env.MAIL_PASSWORD

  },
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false
}
module.exports = class Email {
  constructor (raw, _email, plugins) {
    this._raw = raw
    this._email = _email
    this.from = raw.from.value[0].address
    this.to = raw.to.value[0].address
    this.subject = raw.subject
    this.body = raw.text
    // as of now dosent exist
    this.id = raw.messageId
    const _this = this
    if (plugins) {
      plugins.forEach((plugin) => plugin.init(raw, _this))
    }
  }
  respond (text, ops = { reply: true, useText: false}) {
    const _this = this
    return new Promise((res, reject) => {
      let _config = {...config}
      _config.auth.user = ops.email || _this.to
      _config.auth.pass = ops.password || _config.auth.pass
// console.log(_config)
      const transport = nodemailer.createTransport({
        host: ops.host || config.host,
        port: ops.host || config.port,
        secure: ops.host || config.secure, // upgrade later with STARTTLS
        auth: _config.auth,
        tls: {
            // do not fail on invalid certs
          rejectUnauthorized: false
        }
      })
      transport.sendMail({
        from: _this._email,
        to: ops.email || this.from,
        subject: ops.subject || ops.useText ? null: 'Response',
        html: ops.useText ? undefined : text,
        text: ops.useText ? text : undefined,
        inReplyTo: ops.reply !== false ? this.id : null,
        list: {
    // List-Help: <mailto:admin@example.com?subject=help>
          help: 'mailto:neon@saahild.com?subject=help',
    // List-Unsubscribe: <http://example.com> (Comment)
          unsubscribe: {
            url: 'mailto:' + _this._email + '?subject=!unsubscribe'
        // comment: 'Unsubscribe from ' + _this._email
          },
    // List-Subscribe: <mailto:admin@example.com?subject=subscribe>
    // // List-Subscribe: <http://example.com> (Subscribe)
          subscribe: [
            `mailto:neon@saahild.com?subject=${encodeURIComponent('Re-Subscribe to ' + _this._email)}&body=${encodeURIComponent('I would like to re-use this service!')}`
        // {
        //     url: 'http://saahild.com.com',
        //     comment: 'Subscribe'
        // }
          ]
        }
      }).then(() => {
        res()
      })
    })
  }
  fetch () { return this }
}
