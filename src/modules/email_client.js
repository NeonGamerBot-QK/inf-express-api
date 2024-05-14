const nodemailer = require('nodemailer');
const config = {
    auth: {
        user: '',
        pass: process.env.MAIL_PASSWORD,
      
    },
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
}
module.exports = class Email {
    constructor(raw, _email) {
        this._raw = raw;
        this._email = _email;
        this.from = raw.headers.from
        this.to = raw.headers.to
        this.subject = raw.subject
        this.body = raw.text
        this.id = raw.messageId
    }
    respond(text, ops = { reply: true }) {
const _this = this;
     return new Promise((res, reject) => {
        let _config = {...config}
        _config.auth.user = ops.email || _this.to
        
// console.log(_config)
     const transport =    nodemailer.createTransport({
        host: ops.host || config.host,
        port: ops.host ||config.port,
        secure: ops.host ||config.secure, // upgrade later with STARTTLS
        auth: _config.auth,
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false,
          },
      });
transport.sendMail({
from: _this._email,
to: ops.email || this.from,
subject: ops.subject || "Response",
html: text,
inReplyTo: ops.reply !== false ? this.id : null,
list: {
    // List-Help: <mailto:admin@example.com?subject=help>
    help: 'mailto:neon@saahild.com?subject=help',
    // List-Unsubscribe: <http://example.com> (Comment)
    unsubscribe: {
        url: 'mailto:'+_this._email+"?subject=!unsubscribe",
        // comment: 'Unsubscribe from ' + _this._email
    },
    // List-Subscribe: <mailto:admin@example.com?subject=subscribe>
    // // List-Subscribe: <http://example.com> (Subscribe)
    subscribe: [
        `mailto:neon@saahild.com?subject=${encodeURIComponent("Re-Subscribe to "+ _this._email)}&body=${encodeURIComponent("I would like to re-use this service!")}`,
        // {
        //     url: 'http://saahild.com.com',
        //     comment: 'Subscribe'
        // }
    ]
}
}) .then(() => {
res()
})    
})    
    }
    fetch () { return this; }
}