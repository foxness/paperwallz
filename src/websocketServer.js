let WebSocket = require('ws')
let Globals = require('./globals')
let User = require('./models/user')
let Wallpaper = require('./models/wallpaper')
let secret = require('./config/secret')

let wss = new WebSocket.Server({ server: Globals.httpServer })

let getQueueInfo = async(userId) =>
{
    let result = await User.findById(userId).populate('queue').populate('completed').exec()

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

    return info
}

let addWallpaper = async(userId, title, url) =>
{
    let wallpaper = new Wallpaper({ title: title, url: url })

    wallpaper = await wallpaper.save()

    let user = await User.findById(userId)

    user.queue.push(wallpaper)
    await user.save()
}

let deleteWallpaper = async(id) =>
{
    await Promise.all(
        [
            Wallpaper.findByIdAndRemove(id),

            User.update({ 'queue': id }, { '$pull': { 'queue': id } }, )
        ])
}

Globals.sendQueueInfoToUser = async(userId) =>
{
    let info = await getQueueInfo(userId)
    let sent = JSON.stringify({ type: 'queueInfo', value: info })
    Globals.users[userId].wsConnection.send(sent)
    // console.log(`sent: ${sent}`)
}

wss.on('connection', (connection, req) =>
{
    let firstMessageReceived = false
    let userId = null

    connection.on('message', async(message) =>
    {
        let json = JSON.parse(message)

        if (!firstMessageReceived)
        {
            if (json.type == 'cookie')
            {
                for (let userId_ in Globals.users)
                {
                    if (Globals.users[userId_].customSessionCookie == json.value.cookie)
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

        switch (json.type)
        {
            case 'cookie': break // should already be handled at this point

            case 'queueInfo':
                {
                    await Globals.sendQueueInfoToUser(userId)

                    break
                }

            case 'queueToggle':
                {
                    if (json.value == 'start')
                        Globals.users[userId].timer.start()
                    else if (json.value == 'stop')
                        Globals.users[userId].timer.stop()
                    else
                        throw new Error('ACHTUNG: HACKER DETECTED')

                    break
                }

            case 'queueAdd':
                {
                    await addWallpaper(userId, json.value.title, json.value.url)
                    await Globals.sendQueueInfoToUser(userId)

                    break
                }

            case 'queueDelete':
                {
                    await deleteWallpaper(json.value.id)
                    await Globals.sendQueueInfoToUser(userId)

                    break
                }

            case 'queueMove':
                {
                    let user = await User.findById(userId)
                    user.queue.splice(json.value.afterIndex, 0, user.queue.splice(json.value.beforeIndex, 1)[0])
                    await user.save()

                    break
                }

            case 'queueTimeleft':
                {
                    Globals.users[userId].timer.changeTimeleft(parseInt(json.value.ms))

                    break
                }

            case 'queueInterval':
                {
                    Globals.users[userId].timer.changeInterval(parseInt(json.value.ms))

                    break
                }
            
            case 'imgurClientId':
                {
                    let sent = JSON.stringify({ type: 'imgurClientId', value: secret.imgur_clientid })
                    Globals.users[userId].wsConnection.send(sent)

                    break
                }
            
            default: throw new Error('ACHTUNG: HACKER DETECTED')
        }
    })
})

module.exports = wss