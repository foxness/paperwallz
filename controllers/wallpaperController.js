var Wallpaper = require('../models/wallpaper');

exports.wallpaper_list = (req, res) => {
    Wallpaper.find()
        //.sort([['family_name', 'ascending']])
        .exec((err, list_wallpapers) => {
            if (err) { return next(err); }
            //Successful, so render
            res.render('index', { wallpaper_list: list_wallpapers });
        });
}

exports.wallpaper_add = (req, res) => {
    var wallpaper = new Wallpaper({ title: req.body.title, url: req.body.url })

    Wallpaper.findOne({ 'url': req.body.url })
        .exec((err, found_wallpaper) => {
            console.log('found_wallpaper: ' + found_wallpaper);
            if (err) { return next(err); }

            if (found_wallpaper) {
                res.send('Wallpaper already exists');
            }
            else {
                wallpaper.save(function (err) {
                    if (err) { return next(err); }
                    res.end()
                });
            }
        });
}