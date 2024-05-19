// default template 
module.exports = (router, db) => {
    function updateItems(b) {
        const currentItems = db.get('all_webhook')
        currentItems.push(b)
        db.set('all_webhook', currentItems)
    }
    if(!db.get('all_webhook'))db.set('all_webhook', [])
    router.post('/webhook', (req,res) => {
        const body = JSON.parse(req.body.data)
        console.log(body)
        updateItems(body)
        // check if its a shop one 
        if(body.type == "Shop Order") {
  // lets extract the identity info
        // address will not be included becuase they should all be digital...
        const email = body.email
        const transactionId = body.kofi_transaction_id
        // can pass an ID thru the message
        const message = body.message
        const items_bought = body.shop_items
        // const currentItems = db.get('shop_store')
// TODO:
        }
      
        // const 
        // console.log(req.body)
        res.send(`200`)
    })
}
module.exports.socket_handle = (socket,io,db) => {
    socket.emit('ping')
    socket.on('pong', () => {
        socket.emit('ping')
    })
    socket.disconnect()
}
