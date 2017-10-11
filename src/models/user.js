let mongoose = require('mongoose')

let Schema = mongoose.Schema

let UserSchema = Schema(
{
    name: { type: String, required: true },
    refreshToken: { type: String, required: true },
    accessToken: { type: String, required: false },
    accessTokenExpireDate: { type: Date, required: false },
    queue: { type: [{ type: Schema.Types.ObjectId, ref: 'Wallpaper' }] },
    completed: { type: [{ type: Schema.Types.ObjectId, ref: 'Wallpaper' }] }
})

module.exports = mongoose.model('User', UserSchema)