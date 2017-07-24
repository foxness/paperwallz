let mongoose = require('mongoose')

let Schema = mongoose.Schema

let QueueSchema = Schema(
{
    queue : [{ type: Schema.Types.ObjectId, ref: 'Wallpaper', required: true }],
    name : { type: String, required: true }
})

module.exports = mongoose.model('Queue', QueueSchema)