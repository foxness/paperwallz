let mongoose = require('mongoose')

let Schema = mongoose.Schema

let WallpaperSchema = Schema(
{
    title: { type: String, required: true },
    url: { type: String, required: true }
})

// // Virtual for author's full name
// WallpaperSchema
// .virtual('name')
// .get(function () {
//   return this.family_name + ', ' + this.first_name;
// });

// // Virtual for author's URL
// WallpaperSchema
// .virtual('url')
// .get(function () {
//   return '/catalog/author/' + this._id;
// });

//Export model
module.exports = mongoose.model('Wallpaper', WallpaperSchema)