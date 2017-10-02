let WebSocket = require('ws')
let async = require('async')
let Globals = require('./globals')
let User = require('../models/user')
let Wallpaper = require('../models/wallpaper')

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

let addWallpaper = (userId, title, url, callback) =>
{
    let wallpaper = new Wallpaper({ title: title, url: url })

    async.waterfall(
        [
            (callback_) =>
            {
                wallpaper.save((err, result) =>
                {
                    callback_(err, result) // i don't even know why i have to do this explicitly,
                })                         // simply passing the callback_ to save() won't work for some reason
            },

            (wallpaper_, callback_) =>
            {
                User.findById(userId, (err, user) =>
                {
                    callback_(err, user, wallpaper_)
                })
            },

            (user, wallpaper_, callback_) =>
            {
                user.queue.push(wallpaper_)
                user.save(callback_)
            }
        ],
        (err, results) =>
        {
            callback(err)
        })
}

let deleteWallpaper = (id, callback) =>
{
    async.parallel(
        [
            (callback_) =>
            {
                Wallpaper.findByIdAndRemove(id, callback_)
            },

            (callback_) =>
            {
                User.update(
                    { 'queue': id },
                    { '$pull': { 'queue': id }},
                    callback_
                )
            }
        ],
        (err, results) =>
        {
            callback(err)
        })
}

wss.sendQueueInfoToUser = (userId, callback) =>
{
    getQueueInfo(userId, (err, result) =>
    {
        if (err)
            return callback(err)

        let sent = JSON.stringify({ type: 'queueInfo', value: result })
        Globals.users[userId].wsConnection.send(sent)
        console.log(`sent: ${sent}`)
        callback()
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
            wss.sendQueueInfoToUser(userId, (err) =>
            {
                if (err)
                    throw err
            })
        }
        else if (json.type == 'queueToggle')
        {
            if (json.value == 'start')
                Globals.users[userId].timer.start()
            else if (json.value == 'stop')
                Globals.users[userId].timer.stop()
            else
                throw new Error() // ACHTUNG: HACKER DETECTED
        }
        else if (json.type == 'queueAdd')
        {
            async.waterfall(
                [
                    (callback) =>
                    {
                        addWallpaper(userId, json.value.title, json.value.url, callback)
                    },

                    (callback) =>
                    {
                        wss.sendQueueInfoToUser(userId, callback)
                    }
                ],
                (err, results) =>
                {
                    if (err)
                        throw err
                })
        }
        else if (json.type == 'queueDelete')
        {
            async.waterfall(
                [
                    (callback) =>
                    {
                        deleteWallpaper(json.value.id, callback)
                    },

                    (callback) =>
                    {
                        wss.sendQueueInfoToUser(userId, callback)
                    }
                ],
                (err, results) =>
                {
                    if (err)
                        throw err
                })
        }
    })
})

module.exports = wss