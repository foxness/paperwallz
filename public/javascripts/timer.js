const countdownDate = moment().add(7, 'days')
const timerId = '#timer'

let interval = {}

function tick()
{
    let dist = moment.duration(countdownDate.diff(moment()))
    $(timerId).text(`${dist.days()}d ${dist.hours()}h ${dist.minutes()}m ${dist.seconds()}s ${dist.milliseconds()}ms`)

    if (dist.asMilliseconds() <= 0)
    {
        clearInterval(interval)
        $(timerId).text(`expired`)
    }
}

interval = setInterval(tick, 1)