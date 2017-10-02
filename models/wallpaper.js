let mongoose = require('mongoose')

let Schema = mongoose.Schema

let WallpaperSchema = Schema(
{
    title: { type: String, required: true },
    url: { type: String, required: true },
    completedUrl: { type: String, required: false },
    completionDate: { type: Date, required: false }
})

module.exports = mongoose.model('Wallpaper', WallpaperSchema)