let WebSocket = require('ws')
let moment = require('moment')
let Globals = require('./globals')
let User = require('./models/user')
let Wallpaper = require('./models/wallpaper')
let secret = require('./config/secret')
let Imgur = require('./imgur.js')

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
    sendToUser(userId, { type: 'queueInfo', value: await getQueueInfo(userId) })
}

let sendToUser = (userId, obj) =>
{
    let sent = JSON.stringify(obj)
    Globals.users[userId].wsConnection.send(sent)
    console.log(`sent: ${sent}`)
}

wss.on('connection', (connection, req) =>
{
    let firstMessageReceived = false
    let userId = null

    connection.on('message', async(message) =>
    {
        let json = JSON.parse(message)

        console.log(`received: ${message}`)

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
            
            case 'imgurInfo':
                {
                    let user = await User.findById(userId)
                    sendToUser(userId,
                        {
                            type: 'imgurInfo',
                            value:
                                (
                                    user.connectedToImgur ?
                                    { imgurConnected: true, imgurName: user.imgurName }
                                    :
                                    { imgurConnected: false, imgurClientId: secret.imgur_clientid }
                                )
                        })

                    break
                }
            
            case 'imgurCallbackData':
                {
                    let user = await User.findByIdAndUpdate(userId,
                        {
                            connectedToImgur: true,
                            imgurAccountId: json.value.account_id,
                            imgurName: json.value.account_username,
                            imgurRefreshToken: json.value.refresh_token,
                            imgurAccessToken: json.value.access_token,
                            imgurAccessTokenExpirationDate: moment().add(parseInt(json.value.expires_in), 's').toDate(),
                        })

                    sendToUser(userId, { status: 'OK' })

                    break
                }

            case 'imgurTest':
                {
                    let foundUser = await User.findById(userId)
                    let foundWallpaper = await Wallpaper.findById(foundUser.queue[0].toString())
                    let imgur = new Imgur(foundUser)
                    let result = await imgur.post(foundWallpaper.url)
        
                    // foundWallpaper.completedUrl = completedUrl
                    // foundWallpaper.completionDate = new Date()
                    // foundWallpaper = await foundWallpaper.save()
                    // console.log(`${foundUser.name} POSTED [${timer.timeLeft.asSeconds()}] [${completedUrl}]`)
        
                    // foundUser.completed.push(foundWallpaper)
                    // foundUser.queue.shift()
                    // foundUser = await foundUser.save()
                    // await Globals.sendQueueInfoToUser(user.id)

                    sendToUser(userId, { type: 'imgurJson', value: result })

                    break
                }
            
            default: throw new Error('ACHTUNG: HACKER DETECTED')
        }
    })
})

module.exports = wss