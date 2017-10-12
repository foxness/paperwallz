let passport = require('passport')
let moment = require('moment')
let async = require('async')
let crypto = require('crypto')
let RedditStrategy = require('passport-reddit').Strategy
let Promise = require('promise')

let Timer = require('./timer')
let Wallpaper = require('./models/wallpaper')
let Reddit = require('./reddit')
let User = require('./models/user')
let secret = require('./config/secret')
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
            let foundUser = await User.findById(user.id)
            let foundWallpaper = Wallpaper.findById(foundUser.queue[0].toString())
            let reddit = new Reddit(foundUser)
            let completedUrl = await Promise.denodeify(reddit.post)(foundWallpaper.url, foundWallpaper.title)

            foundWallpaper.completedUrl = completedUrl
            foundWallpaper.completionDate = new Date()
            foundWallpaper = await foundWallpaper.save()
            console.log(`${foundUser.name} POSTED [${timer.timeLeft.asSeconds()}] [${completedUrl}]`)

            foundUser.completed.push(foundWallpaper)
            foundUser.queue.shift()
            foundUser = await foundUser.save()
            await Globals.sendQueueInfoToUser(user.id)
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
        clientID: secret.reddit_clientid,
        clientSecret: secret.reddit_secret,
        callbackURL: 'http://localhost/callback',
        scope: 'submit'
    },
    async (accessToken, refreshToken, profile, done) =>
    {
        try
        {
            let user = await User.findOne({ name: profile.name })
            let tokenExpire = moment().add(1, 'h').toDate()
    
            if (user)
            {
                user = await User.findByIdAndUpdate(user.id, { accessToken: accessToken, refreshToken: refreshToken, accessTokenExpireDate: tokenExpire })
            }
            else
            {
                user = new User(
                {
                    name: profile.name,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    accessTokenExpireDate: tokenExpire,
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