
const timerId = '#timer'

let interval = null
let dist = null
let submissionDate = null
let timerPaused = true

function updateTimer(distance)
{
    dist = moment.duration(distance)
    updateTimerText()
}

function updateTimerText()
{
    $(timerId).text(`${dist.days()}d ${dist.hours()}h ${dist.minutes()}m ${dist.seconds()}s ${dist.milliseconds()}ms`)
}

function tick()
{
    dist = moment.duration(submissionDate.diff(moment()))
    updateTimerText()

    if (dist.asMilliseconds() <= 0)
    {
        timerPaused = true
        clearInterval(interval)
        $(timerId).text(`expired`)
    }
}

function startTimer()
{
    submissionDate = moment().add(dist)
    timerPaused = false
    interval = setInterval(tick, 1)
}

function stopTimer()
{
    timerPaused = true
    clearInterval(interval)
}