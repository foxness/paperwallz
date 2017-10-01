const WebSocket = require('ws');
const Globals = require('./Globals')

const wss = new WebSocket.Server({ server: Globals.httpServer })

wss.on('connection', (connection, req) =>
{
    connection.on('message', (message) =>
    {
        console.log('received: %s', message)
    })

    connection.send('something')
})

module.exports = wss