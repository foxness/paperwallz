let WebSocket = require('ws')
let Globals = require('./globals')

let wss = new WebSocket.Server({ server: Globals.httpServer })

wss.on('connection', (connection, req) =>
{
    let firstMessageReceived = false
    let userId = null

    connection.on('message', (message) =>
    {
        let json = JSON.parse(message)

        if (!firstMessageReceived)
        {
            if (json.type == 'cookie' && json.value)
            {
                for (userId_ in Globals.users)
                {
                    if (json.value === Globals.users[userId_].customSessionCookie)
                    {
                        userId = userId_
                        Globals.users[userId].wsConnection = connection
                        break
                    }
                }
            }

            if (!userId)
            {
                connection.terminate()
                return
            }

            firstMessageReceived = true
        }

        console.log('received: %s', message)
    })
    
    connection.send('something')
})

module.exports = wss