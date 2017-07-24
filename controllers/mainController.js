let Wallpaper = require('../models/wallpaper')
let Queue = require('../models/queue')
let async = require('async')

exports.queue_get = (req, res, next) =>
{
    Queue.findOne({ 'name': 'foxneZz' }).populate('queue').exec((err, queue) =>
    {
        let q = queue

        if (err)
            return next(err)

        if (!q)
        {
            q = new Queue({ name: 'foxneZz', queue: [] })
            q.save()
        }

        res.render('queue_get', { queue: q })
    })
}

exports.wallpaper_add = (req, res, next) =>
{
    Queue.findOne({ 'name': 'foxneZz' }).populate('queue').exec((err, queue) =>
    {
        if (err)
            return next(err)

        let wallpaper = new Wallpaper({ title: req.body.title, url: req.body.url })

        async.series(
            [
                (callback) => { wallpaper.save(callback) },
                (callback) =>
                {
                    queue.queue.push(wallpaper)
                    queue.save(callback)
                }
            ],
            (err, results) => { res.end() })
    })
}

exports.wallpaper_delete = (req, res, next) =>
{
    Wallpaper.findByIdAndRemove(req.body.id, (err, results) => { res.end() })
}