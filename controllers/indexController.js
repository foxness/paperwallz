var Wallpaper = require('../models/wallpaper');

exports.index_get = (req, res) =>
{
    Wallpaper.find()
    //.sort([['family_name', 'ascending']])
    .exec((err, list_wallpapers) =>
    {
        if (err) { return next(err); }
        //Successful, so render
        res.render('index', { wallpaper_list: list_wallpapers });
    });
}

exports.index_post = (req, res) =>
{
    res.send('NOT IMPLEMENTED: Index POST');
}