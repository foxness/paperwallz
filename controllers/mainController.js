let Wallpaper = require('../models/wallpaper')
let User = require('../models/user')
let async = require('async')

exports.user_get = (req, res, next) =>
{
    User.findOne({ 'name': 'foxneZz' }).populate('queue').exec((err, user) =>
    {
        let u = user

        if (err)
            return next(err)

        if (u)
            res.render('user_get', { user: u })
        else
        {
            u = new User({ name: 'foxneZz', queue: [] })
            u.save((err) =>
            {
                if (err)
                    return next(err)
                
                res.render('user_get', { user: u })
            })
        }
    })
}

exports.wallpaper_add = (req, res, next) =>
{
    User.findOne({ 'name': 'foxneZz' }).populate('queue').exec((err, user) =>
    {
        if (err)
            return next(err)

        let wallpaper = new Wallpaper({ title: req.body.title, url: req.body.url })

        async.series(
            [
                (callback) => { wallpaper.save(callback) },
                (callback) =>
                {
                    user.queue.push(wallpaper)
                    user.save(callback)
                }
            ],
            (err, results) => { res.end() })
    })
}

exports.wallpaper_delete = (req, res, next) =>
{
    Wallpaper.findByIdAndRemove(req.body.id, (err, results) => { res.end() })
}