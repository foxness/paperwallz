let WebSocket = require('ws')
let Globals = require('./globals')
let User = require('../models/user')

let wss = new WebSocket.Server({ server: Globals.httpServer })

let getQueueInfo = (userId, callback) =>
{
    User.findById(userId).populate('queue').populate('completed').exec((err, result) =>
    {
        if (err)
            return callback(err)

        let timer = Globals.users[result.id].timer
        
        let info = { queue: [], queueCompleted: [], queuePaused: timer.paused }
        for (let wallpaper of result.queue) // todo: use map()
            info.queue.push({ title: wallpaper.title, url: wallpaper.url, id: wallpaper.id })
        
        for (let wallpaper of result.completed) // todo: use map()
            info.queueCompleted.push({ title: wallpaper.title, url: wallpaper.url, completedUrl: wallpaper.completedUrl })

        info.queueInterval = timer.interval.asMilliseconds()
        
        if (info.queuePaused)
            info.queueTimeLeft = timer.timeLeft.asMilliseconds()
        else
            info.queueSubmissionDate = timer.tickDate.toDate()

        callback(null, info)
    })
}

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

        console.log(`received: ${message}`)

        if (json.type == 'need' && json.value == 'queueInfo')
        {
            getQueueInfo(userId, (err, result) =>
            {
                let sent = JSON.stringify(result)
                connection.send(sent)
                console.log(`sent: ${sent}`)
            })
        }
    })
    // connection.send('something')
})

module.exports = wss