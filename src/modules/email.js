// handle n8n module parsing
const EmailClient = require('./email_client')
let debug = false;
/**
 *
 * Body Should consit of {isValidEmailRequest:true, email:[...], stamp: "DATE:00000", workflow: [...] }
 * @param {Object} config
 * @returns
 */
module.exports = (config, cb) => (req, res, next) => {
  console.log(req.headers, req.body)
  if(debug) return res.status(200).end()
  const isEmailRequest = req.method === 'POST' && req.body && req.body.isValidEmailRequest && req.headers['x-mail-header'] == config.mailsignkey
  if (config.shallNotPassIfNotValid && !isEmailRequest) {
    return res.status(400).json({ error: 'Not valid email signature, check ur body or auth.'})
  }
  req.isEmailRequest = isEmailRequest
  if (isEmailRequest) {
    req.email = req.body.email
    res.email_client = new EmailClient(req.email, config.email)
  }
  if (cb && typeof cb === 'function') {
    cb(req, res)
  } else {
    next() // no matter what call next;
  }
}
