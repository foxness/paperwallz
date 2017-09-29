let passport = require('passport')
let moment = require('moment')
let async = require('async')
let crypto = require('crypto')
let RedditStrategy = require('passport-reddit').Strategy

let Timer = require('./timer')
let Wallpaper = require('../models/wallpaper')
let Reddit = require('./reddit')
let User = require('../models/user')
let secret = require('../config/secret')
let Globals = require('./globals')

passport.serializeUser((user, done) =>
{
    done(null, user.id)
})

passport.deserializeUser((obj, done) =>
{
    User.findById(obj, (err, result) =>
    {
        done(err, result)
    })
})

let userRuntimeFirstSetup = (user) =>
{
    if (!(user.id in Globals.users))
    {
        let csc = crypto.randomBytes(32).toString('hex')
        Globals.users[user.id] = { timer: null, wsConnection: null, customSessionCookieSet: false, customSessionCookie: csc }

        let timer = new Timer(moment.duration(1, 'm'))
        timer.on('tick', () =>
        {
            async.waterfall(
                [
                    (callback) =>
                    {
                        // the queue in user.queue is not updated by the time the timer ticks
                        // so we update our user to get current queue items

                        User.findById(user.id, callback)
                    },

                    (foundUser, callback) =>
                    {
                        Wallpaper.findById(foundUser.queue[0].toString(), (err, foundWallpaper) =>
                        {
                            callback(err, foundUser, foundWallpaper)
                        })
                    },

                    (foundUser, foundWallpaper, callback) =>
                    {
                        let reddit = new Reddit(foundUser)
                        reddit.post(foundWallpaper.url, foundWallpaper.title, (err, completedUrl) =>
                        {
                            callback(err, foundUser, foundWallpaper, completedUrl)
                        })
                    },

                    (foundUser, foundWallpaper, completedUrl, callback) =>
                    {
                        foundWallpaper.completedUrl = completedUrl
                        foundWallpaper.completionDate = new Date()
                        foundWallpaper.save((err, foundWallpaper_) =>
                        {
                            console.log(`${foundUser.name} POSTED [${timer.timeLeft.asSeconds()}] [${completedUrl}]`)
                            callback(err, foundUser, foundWallpaper_)
                        })
                    },

                    (foundUser, foundWallpaper, callback) =>
                    {
                        foundUser.completed.push(foundWallpaper)
                        foundUser.queue.shift()
                        foundUser.save(callback)
                    }
                ],
                (err, results) =>
                {
                    if (err)
                        throw err
                })
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
    (accessToken, refreshToken, profile, done) =>
    {
        User.findOne({ name: profile.name }, (err, result) =>
        {
            if (err)
                return done(err)

            let tokenExpire = moment().add(1, 'h').toDate()

            if (result)
            {
                User.findByIdAndUpdate(result.id, { accessToken: accessToken, refreshToken: refreshToken, accessTokenExpireDate: tokenExpire }, (err, result) =>
                {
                    if (err)
                        return done(err)
                    
                    userRuntimeFirstSetup(result)
                    return done(null, result)
                })
            }
            else
            {
                let user = new User(
                {
                    name: profile.name,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    accessTokenExpireDate: tokenExpire,
                })

                user.save((err, result) =>
                {
                    if (err)
                        return done(err)
                    
                    userRuntimeFirstSetup(result)
                    return done(null, result)
                })
            }
        })
    }
))

module.exports = passport