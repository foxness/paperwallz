let async = require('async')
let crypto = require('crypto')

let passport = require('../passport')
let Globals = require('../globals')

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