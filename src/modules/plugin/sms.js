// plugin for ../email_client.js
module.exports = class SmsPlugin {
    init(raw, me) {
        if(raw.attachments[0].filename === 'text_0.txt') {
            // its a txt
            const att = raw.attachments.shift();
            let str = att.content.toString();
            me.body = str;
        }
    }
    sendMail() {
        
    }
}