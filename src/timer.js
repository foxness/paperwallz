let EventEmitter = require('events')
let moment = require('moment')

class Timer extends EventEmitter
{
    constructor(interval) // moment.duration
    {
        super()
        this.paused = true
        this.timeLeft = interval
        this.tickDate = null
        this.interval = interval
        this.timeoutId = null
    }

    start()
    {
        if (!this.paused)
            return
        
        this.paused = false
        this.tickDate = moment().add(this.timeLeft)
        this.timeoutId = setTimeout(this.tick.bind(this), this.timeLeft.asMilliseconds())
        this.emit('start')
    }

    tick()
    {
        this.timeLeft = this.interval
        this.tickDate = moment().add(this.timeLeft)
        this.timeoutId = setTimeout(this.tick.bind(this), this.timeLeft.asMilliseconds())
        this.emit('tick')
    }

    stop()
    {
        if (this.paused)
            return
        
        this.paused = true
        clearTimeout(this.timeoutId)
        this.timeoutId = null
        this.timeLeft = moment.duration(this.tickDate.diff(moment()))
        this.emit('stop')
    }

    changeTimeleft(timeLeft)
    {
        if (!this.paused)
            return
        
        this.timeLeft = moment.duration(timeLeft)
        this.emit('changeTimeleft')
    }

    changeInterval(interval)
    {
        if (!this.paused)
            return
        
        this.interval = moment.duration(interval)
        this.timeLeft = this.interval
        this.emit('changeInterval')
    }
}

module.exports = Timer