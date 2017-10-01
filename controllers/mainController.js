let async = require('async')
let crypto = require('crypto')
let moment = require('moment')

let passport = require('../classes/passport')
let Wallpaper = require('../models/wallpaper')
let User = require('../models/user')
let Timer = require('../classes/timer')
let Globals = require('../classes/globals')

const cookieName = 'superSecretCookie1337'

exports.queue = (req, res, next) =>
{
    if (!Globals.users[req.user.id].customSessionCookieSet
        || !req.cookies[cookieName]
        || req.cookies[cookieName] != Globals.users[req.user.id].customSessionCookie)
    {
        res.cookie(cookieName, Globals.users[req.user.id].customSessionCookie, { maxAge: 1000*60*60*24*365 })
        Globals.users[req.user.id].customSessionCookieSet = true
    }
    
    res.render('queue', { user: req.user })
}

exports.queue_info = (req, res, next) =>
{
    User.findById(req.user.id).populate('queue').populate('completed').exec((err, result) =>
    {
        if (err)
            throw new Error(`USER POPULATION ERROR: ${err}`)

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

        res.json(info)
    })
}

exports.queue_start = (req, res, next) =>
{
    Globals.users[req.user.id].timer.start()
    res.end()
}

exports.queue_stop = (req, res, next) =>
{
    Globals.users[req.user.id].timer.stop()
    res.end()
}

exports.wallpaper_add = (req, res, next) =>
{
    let wallpaper = new Wallpaper({ title: req.body.title, url: req.body.url })

    async.series(
        [
            (callback) => { wallpaper.save(callback) },
            (callback) =>
            {
                req.user.queue.push(wallpaper)
                req.user.save(callback)
            }
        ],
        (err, results) =>
        {
            if (err)
                return next(err)

            res.end()
        })
}

exports.wallpaper_delete = (req, res, next) =>
{
    async.parallel(
        [
            (callback) =>
            {
                Wallpaper.findByIdAndRemove(req.body.id, callback)
            },

            (callback) =>
            {
                User.update(
                    { 'queue': req.body.id },
                    { '$pull': { 'queue': req.body.id }},
                    callback
                )
            }
        ],
        (err, results) =>
        {
            if (err)
                return next(err)

            res.end()
        })
}

exports.login = (req, res, next) =>
{
    if (req.isAuthenticated())
        return res.redirect('/queue')

    res.render('login')
}

exports.auth_reddit = (req, res, next) =>
{
    req.session.state = crypto.randomBytes(32).toString('hex')
    passport.authenticate('reddit',
    {
        state: req.session.state,
        duration: 'permanent'
    })(req, res, next)
}

exports.reddit_callback = (req, res, next) =>
{
    if (req.query.state == req.session.state)
    {
        passport.authenticate('reddit',
        {
            successRedirect: '/queue',
            failureRedirect: '/login'
        })(req, res, next)
    }
    else
        next(new Error(403))
}

exports.logout = (req, res, next) =>
{
    req.logout()
    res.redirect('/login')
}

exports.index = (req, res, next) =>
{
    res.redirect('/login')
}