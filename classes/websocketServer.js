const WebSocket = require('ws');
const globals = require('./globals')

const wss = new WebSocket.Server({ server: globals.httpServer })

wss.on('connection', (connection) =>
{
    connection.on('message', (message) =>
    {
        console.log('received: %s', message)
    })

    connection.send('something')
})