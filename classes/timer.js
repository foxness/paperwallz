let EventEmitter = require('events')
let moment = require('moment')

class Timer extends EventEmitter
{
    constructor(interval) // moment.duration
    {
        super()
        this.states =
        {
            on: 'on',
            off: 'off',
            reset: 'reset'
        }
        this.interval = interval
        this.reset()
    }

    reset()
    {
        this.state = this.states.reset
        this.totalOnDuration = moment.duration(0)
        this.lastStartDate = undefined
        if (this.timeout)
            clearTimeout(this.timeout)
        this.timeout = undefined
    }

    timePassed()
    {
        return moment.duration(this.totalOnDuration.asMilliseconds() + (this.state === this.states.on ? moment().diff(this.lastStartDate) : 0))
    }

    timeLeft()
    {
        return moment.duration(this.interval.asMilliseconds() - this.timePassed().asMilliseconds())
    }

    tick()
    {
        this.lastStartDate = moment()
        this.totalOnDuration = moment.duration(0)
        this.timeout = setTimeout(this.tick.bind(this), this.interval.asMilliseconds())
        this.emit('tick')
    }

    start()
    {
        if (this.state === this.states.on)
            return

        this.lastStartDate = moment()
        this.timeout = setTimeout(this.tick.bind(this), this.timeLeft())
        this.state = this.states.on
        this.emit('start')
    }

    stop()
    {
        if (this.state !== this.states.on)
            return
        
        this.totalOnDuration.add(moment().diff(this.lastStartDate), 'ms')
        clearTimeout(this.timeout)
        this.timeout = undefined
        this.state = this.states.off
        this.emit('stop')
    }
}

module.exports = Timer