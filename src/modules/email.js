// handle n8n module parsing
const EmailClient = require('./email_client')
let debug = false
const simpleParser = require('mailparser').simpleParser
/**
 *
 * Body Should consit of {isValidEmailRequest:true, email:[...], stamp: "DATE:00000", workflow: [...] }
 * @param {Object} config
 * @returns
 */
module.exports = (config, cb) => async (req, res, next) => {
  if (debug) console.debug(req.headers, req.body)
  if (debug) return res.status(200).end()
  const isEmailRequest = req.method === 'POST' && req.body && req.body.isValidEmailRequest && req.headers['x-mail-header'] == config.mailsignkey
  if (config.shallNotPassIfNotValid && !isEmailRequest) {
    return res.status(400).json({ error: 'Not valid email signature, check ur body or auth.'})
  }
  req.isEmailRequest = isEmailRequest
  if (isEmailRequest) {
    req.email = await simpleParser(req.body.email.raw)
    res.email_client = new EmailClient(req.email, config.email, config.plugins)
  }
  if (cb && typeof cb === 'function') {
    cb(req, res)
  } else {
    next() // no matter what call next;
  }
}
