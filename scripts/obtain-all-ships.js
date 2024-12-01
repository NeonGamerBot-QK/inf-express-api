// dump them all into a json file cuz db injection is scary
require('dotenv').config()
const fs = require('fs')
const webclient = require('@slack/web-api')
const client = new webclient.WebClient(process.env.SLACK_ZEON_TOKEN)
async function fetchMessages(channelId = "C07UA18MXBJ") {
    let messages = [];
    let cursor = null;
    try {
      do {
        // Fetch messages from the channel
        const response = await client.conversations.history({
          channel: channelId,
          cursor: cursor,
          limit: 200, // Max messages per request
        }); 
        messages = messages.concat(response.messages).filter(m => m.user === "U07NGBJUDRD" && !m.subtype);
        cursor = response.response_metadata?.next_cursor;
        // console.log(response)
        console.log(`Quering messages ${cursor || "No cursor"}`)  
        await new Promise(resolve => setTimeout(resolve, 1005));
      } while (cursor); // Continue fetching if there are more pages
  
      console.log(`Fetched ${messages.length} messages.`);
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  async function main() {
    const messages = await fetchMessages()
fs.writeFileSync('ships.json', JSON.stringify(messages))
console.log(`Dumped ${messages.length} messages into ships.json`)
}
main()