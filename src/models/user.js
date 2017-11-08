let mongoose = require('mongoose')

let Schema = mongoose.Schema

let UserSchema = Schema(
{
    name: { type: String, required: true },
    redditRefreshToken: { type: String, required: true },
    redditAccessToken: { type: String, required: false },
    redditAccessTokenExpirationDate: { type: Date, required: false },
    // redditLastPostDate: { type: Date, required: false },
    connectedToImgur: { type: Boolean, required: true, default: false },
    imgurAccountId : { type: String, required: false },
    imgurName: { type: String, required: false },
    imgurRefreshToken: { type: String, required: false },
    imgurAccessToken: { type: String, required: false },
    imgurAccessTokenExpirationDate: { type: Date, required: false },
    queue: { type: [{ type: Schema.Types.ObjectId, ref: 'Wallpaper' }] },
    completed: { type: [{ type: Schema.Types.ObjectId, ref: 'Wallpaper' }] }
})

module.exports = mongoose.model('User', UserSchema)