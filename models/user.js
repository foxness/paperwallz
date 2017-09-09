let mongoose = require('mongoose')

let Schema = mongoose.Schema

let UserSchema = Schema(
{
    name: { type: String, required: true },
    refreshToken: { type: String, required: true },
    accessToken: { type: String, required: false },
    accessTokenExpireDate: { type: Date, required: false },

    queue: { type: [{ type: Schema.Types.ObjectId, ref: 'Wallpaper' }] },
    queuePaused: { type: Boolean, required: true },
    queueTimeoutId: { type: Number, required: false },

    queueTimeLeft: { type: Number, required: true }, // how much time is left in ms when the queue is paused
    queueSubmissionDate: { type: Date, required: false }, // when the queue is running
})

module.exports = mongoose.model('User', UserSchema)