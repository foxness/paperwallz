let async = require('async')
let crypto = require('crypto')
let passport = require('passport')
let moment = require('moment')

let Wallpaper = require('../models/wallpaper')
let User = require('../models/user')
let Reddit = require('../classes/reddit')
let Timer = require('../classes/timer')

let myTimer = new Timer(moment.duration(10, 'seconds'))

myTimer.on('start', () =>
{
    console.log(`[${moment().format('mm:ss')}] timer started (timePassed: ${myTimer.timePassed().asSeconds()} s)`)
})

myTimer.on('tick', () =>
{
    console.log(`[${moment().format('mm:ss')}] timer tick (timePassed: ${myTimer.timePassed().asSeconds()} s)`)
})

myTimer.on('stop', () =>
{
    console.log(`[${moment().format('mm:ss')}] timer stopped (timePassed: ${myTimer.timePassed().asSeconds()} s)`)
})

exports.queue = (req, res, next) =>
{
    req.user.populate('queue', (err, result) =>
    {
        if (err)
            throw new Error(`USER POPULATION ERROR: ${err}`)

        res.render('queue', { user: result })
    })
}

exports.queue_info = (req, res, next) =>
{
    req.user.populate('queue', (err, result) =>
    {
        if (err)
            throw new Error(`USER POPULATION ERROR: ${err}`)

        let info = { queue: [], queuePaused: result.queuePaused }
        for (let wallpaper of result.queue) // todo: use map()
            info.queue.push({ title: wallpaper.title, url: wallpaper.url, id: wallpaper.id })

        if (info.queuePaused)
            info.queueTimeLeft = result.queueTimeLeft
        else
            info.queueSubmissionDate = result.queueSubmissionDate
        
        res.json(info)
    })
}

exports.queue_start = (req, res, next) =>
{
    myTimer.start()
}

exports.queue_stop = (req, res, next) =>
{
    myTimer.stop()
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
    Wallpaper.findByIdAndRemove(req.body.id, (err, results) => { res.end() })
}

exports.wallpaper_post = (req, res, next) =>
{
    Wallpaper.findById(req.body.id, (err, result) =>
    {
        if (err)
            return next(err)

        let reddit = new Reddit(req.user)
        reddit.post(result.url, result.title, (err, result) =>
        {
            if (err)
                return next(err)

            console.log(result)

            res.end()
        })
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
    req.session.state = crypto.randomBytes(32).toString('hex');
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
        })(req, res, next);
    }
    else
        next(new Error(403));
}

exports.logout = (req, res, next) =>
{
    req.logout()
    res.redirect('/login')
}

exports.index = (req, res, next) =>
{
    res.redirect('/login')
    // res.render('index', { user: getPopulatedUser(req) })
}