let mongoose = require('mongoose')

let Schema = mongoose.Schema

let UserSchema = Schema(
{
    queue: { type: [{ type: Schema.Types.ObjectId, ref: 'Wallpaper' }] },
    name: { type: String, required: true },
    accessToken: { type: String, required: false},
    refreshToken: { type: String, required: true}
})

module.exports = mongoose.model('User', UserSchema)