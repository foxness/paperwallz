
const timerId = '#timer'

let intervalId = null
let timeLeft = null
let destinationDate = null
let timerPaused = true
let interval = null

function updateTimer(distance)
{
    interval = timeLeft = moment.duration(distance)
    updateTimerText()
}

function updateTimerText()
{
    $(timerId).text(`${timeLeft.days()}d ${timeLeft.hours()}h ${timeLeft.minutes()}m ${timeLeft.seconds()}s ${timeLeft.milliseconds()}ms`)
}

function tick()
{
    timeLeft = moment.duration(destinationDate.diff(moment()))

    if (timeLeft.asMilliseconds() <= 0)
    {
        destinationDate = moment().add(interval)
        timeLeft = interval
    }

    updateTimerText()
}

function startTimer()
{
    if (!timerPaused)
        return
    
    timerPaused = false
    destinationDate = moment().add(timeLeft)
    intervalId = setInterval(tick, 1)
}

function stopTimer()
{
    if (timerPaused)
        return
    
    timerPaused = true
    clearInterval(intervalId)
}