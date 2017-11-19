let passport = require('passport')
let moment = require('moment')
let async = require('async')
let crypto = require('crypto')
let RedditStrategy = require('passport-reddit').Strategy
let Promise = require('promise')

let Timer = require('./timer')
let Wallpaper = require('./models/wallpaper')
let Reddit = require('./reddit')
let Imgur = require('./imgur')
let User = require('./models/user')
let Globals = require('./globals')

passport.serializeUser((user, done) =>
{
    done(null, user.id)
})

passport.deserializeUser(async (obj, done) =>
{
    try
    {
        done(null, await User.findById(obj))
    }
    catch (err)
    {
        done(err)
    }
})

let userRuntimeFirstSetup = (user) =>
{
    if (!(user.id in Globals.users))
    {
        let csc = crypto.randomBytes(32).toString('hex')
        Globals.users[user.id] = { timer: null, wsConnection: null, customSessionCookieSet: false, customSessionCookie: csc }

        let timer = new Timer(moment.duration(1, 'h'))
        timer.on('tick', async () =>
        {
            try
            {
                let foundUser = await User.findById(user.id)
                let foundWallpaper = await Wallpaper.findById(foundUser.queue[0].toString())
    
                let imgur = new Imgur(foundUser)
                let imgurJson = await imgur.post(foundWallpaper.url)
    
                let reddit = new Reddit(foundUser)
                let postUrl = await reddit.post(imgurJson.data.link, foundWallpaper.title)
    
                foundWallpaper.postDate = new Date()
                foundWallpaper.postUrl = postUrl
                foundWallpaper.imgurId = imgurJson.data.id
                foundWallpaper.imgurDeleteHash = imgurJson.data.deletehash
                foundWallpaper = await foundWallpaper.save()
                console.log(`${foundUser.name} POSTED [${timer.timeLeft.asSeconds()}] [${postUrl}]`)
    
                foundUser.completed.push(foundWallpaper)
                foundUser.queue.shift()
                foundUser = await foundUser.save()
                await Globals.sendQueueInfoToUser(user.id)
            }
            catch (error)
            {
                console.log(`ERROR ${error}`)

                switch (error.message)
                {
                    case 'REDDIT_RATELIMIT':
                    {
                        Globals.sendToUser(user.id,
                            {
                                type: 'error',
                                errorType: 'ratelimit',
                                msUntilResolved: error.msUntilResolved
                            })

                        break
                    }

                    default:
                    {
                        throw error
                    }
                }
            }
        })

        timer.on('start', () =>
        {
            console.log(`${user.name} START [${timer.timeLeft.asSeconds()}]`)
        })

        timer.on('stop', () =>
        {
            console.log(`${user.name} PAUSE [${timer.timeLeft.asSeconds()}]`)
        })

        Globals.users[user.id].timer = timer
    }
}

passport.use(new RedditStrategy(
    {
        clientID: process.env.REDDIT_CLIENTID,
        clientSecret: process.env.REDDIT_SECRET,
        callbackURL: process.env.REDDIT_CALLBACK,
        scope: 'submit'
    },
    async (accessToken, refreshToken, profile, done) =>
    {
        try
        {
            let user = await User.findOne({ name: profile.name })
            let tokenExpirationDate = moment().add(1, 'h').toDate()
    
            if (user)
            {
                user = await User.findByIdAndUpdate(user.id, { redditAccessToken: accessToken, redditRefreshToken: refreshToken, redditAccessTokenExpirationDate: tokenExpirationDate })
            }
            else
            {
                user = new User(
                {
                    name: profile.name,
                    redditAccessToken: accessToken,
                    redditRefreshToken: refreshToken,
                    redditAccessTokenExpirationDate: tokenExpirationDate,
                })
    
                user = await user.save()
            }
    
            userRuntimeFirstSetup(user)
            return done(null, user)
        }
        catch (err)
        {
            return done(err)
        }
    }
))

module.exports = passport