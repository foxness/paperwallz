let Wallpaper = require('../models/wallpaper')

exports.wallpaper_list = (req, res, next) =>
{
    Wallpaper.find()
        //.sort([['family_name', 'ascending']])
        .exec((err, list_wallpapers) =>
        {
            if (err)
                return next(err)

            res.render('index', { wallpaper_list: list_wallpapers })
        })
}

exports.wallpaper_add = (req, res, next) =>
{
    let wallpaper = new Wallpaper({ title: req.body.title, url: req.body.url })

    Wallpaper.findOne({ 'url': req.body.url }).exec((err, found_wallpaper) =>
    {
        if (err)
            return next(err)

        if (found_wallpaper)
        {
            res.send('Wallpaper already exists');
            console.log('found_wallpaper: ' + found_wallpaper)
        }
        else
        {
            wallpaper.save((err) =>
            {
                if (err)
                    return next(err)

                res.end()
            })
        }
    })
}