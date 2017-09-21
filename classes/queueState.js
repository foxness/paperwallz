let moment = require('moment')

class QueueState
{
    constructor()
    {
        this.paused = true
        this.timeoutId = null
        this.timeLeft = moment.duration(30, 's') // how much time is left in ms when the [QUEUE IS PAUSED]
        this.submissionDate = null // [QUEUE IS RUNNING]
    }
}

module.exports = QueueState