let async = require('async')
let crypto = require('crypto')
let passport = require('passport')
let moment = require('moment')

let Wallpaper = require('../models/wallpaper')
let User = require('../models/user')
let Reddit = require('../classes/reddit')
let Timer = require('../classes/timer')

let queueTimers = {}

exports.queue = (req, res, next) =>
{
    if (!(req.user.id in queueTimers))
    {
        let timer = new Timer(moment.duration(1, 'm'))
        timer.on('tick', () =>
        {
            async.waterfall(
                [
                    (callback) =>
                    {
                        // the queue in req.user.queue is not updated by the time the timer ticks
                        // so we update our user to get current queue items

                        User.findById(req.user.id, callback)
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
        
                    res.end()
                })
        })

        timer.on('start', () =>
        {
            console.log(`${req.user.name} START [${timer.timeLeft.asSeconds()}]`)
        })

        timer.on('stop', () =>
        {
            console.log(`${req.user.name} PAUSE [${timer.timeLeft.asSeconds()}]`)
        })

        queueTimers[req.user.id] = timer
    }
    
    res.render('queue', { user: req.user })
}

exports.queue_info = (req, res, next) =>
{
    req.user.populate('queue', (err, result) =>
    {
        if (err)
            throw new Error(`USER POPULATION ERROR: ${err}`)

        let info = { queue: [], queuePaused: queueTimers[result.id].paused }
        for (let wallpaper of result.queue) // todo: use map()
            info.queue.push({ title: wallpaper.title, url: wallpaper.url, id: wallpaper.id })
        
        info.queueInterval = queueTimers[result.id].interval.asMilliseconds()
        
        if (info.queuePaused)
            info.queueTimeLeft = queueTimers[result.id].timeLeft.asMilliseconds()
        else
            info.queueSubmissionDate = queueTimers[result.id].tickDate.toDate()
        
        res.json(info)
    })
}

exports.queue_start = (req, res, next) =>
{
    queueTimers[req.user.id].start()
    res.end()
}

exports.queue_stop = (req, res, next) =>
{
    queueTimers[req.user.id].stop()
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
}