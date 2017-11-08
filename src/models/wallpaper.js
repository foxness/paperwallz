let mongoose = require('mongoose')

let Schema = mongoose.Schema

let WallpaperSchema = Schema(
{
    title: { type: String, required: true },
    url: { type: String, required: true },
    postUrl: { type: String, required: false },
    postDate: { type: Date, required: false },
    imgurId: { type: String, required: false },
    imgurDeleteHash: { type: String, required: false },
})

module.exports = mongoose.model('Wallpaper', WallpaperSchema)