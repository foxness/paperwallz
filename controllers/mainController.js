let async = require('async')
let crypto = require('crypto')
let passport = require('passport')

let Wallpaper = require('../models/wallpaper')
let User = require('../models/user')

exports.queue = (req, res, next) =>
{
    req.user.populate('queue', (err, result) =>
    {
        if (err)
            throw new Error(`USER POPULATION ERROR: ${err}`)

        res.render('queue', { user: result })
    })
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