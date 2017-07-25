let Wallpaper = require('../models/wallpaper')
let User = require('../models/user')
let async = require('async')

exports.user_get = (req, res, next) =>
{
    req.user.populate('queue', (err, result) =>
    {
        if (err)
            return next(err)

        res.render('user_get', { user: result })
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