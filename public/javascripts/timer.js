
const timerId = '#timer'

let intervalId = null
let timeLeft = null
let destinationDate = null
let timerPaused = true
let interval = null
let updateDelay = 100
let inputtingWhileNotPaused = false

function sliderInput()
{
    let ratio = 1 - $('#slider').val() / $('#slider').prop('max')
    timeLeft = moment.duration(interval.asMilliseconds() * ratio)
    
    if (!timerPaused)
    {
        inputtingWhileNotPaused = true
        destinationDate = moment().add(timeLeft)
    }

    updateTimerText()
}

function sliderChange()
{
    inputtingWhileNotPaused = false
}

function updateTimerText()
{
    let text = ''
    let hours = Math.floor(timeLeft.asMilliseconds() / (1000*60*60))
    text += (hours < 10 ? `0${hours}:` : `${hours}:`)
    let minutes = timeLeft.minutes()
    text += (minutes < 10 ? `0${minutes}:` : `${minutes}:`)
    let seconds = timeLeft.seconds()
    text += (seconds < 10 ? `0${seconds}` : `${seconds}`)

    $(timerId).text(text)
}

function updateTimerSlider()
{
    let ratio = 1 - timeLeft.asMilliseconds() / interval.asMilliseconds()
    $('#slider').val(ratio * $('#slider').prop('max'))
}

function updateTimer(paused_, interval_, info_)
{
    interval = moment.duration(interval_)

    if (paused_)
    {
        timeLeft = moment.duration(info_)
        updateInterface()
    }
    else
    {
        timerPaused = false
        destinationDate = moment(new Date(info_))
        tick()
        intervalId = setInterval(tick, updateDelay)
    }
}

function updateInterface()
{
    updateTimerText()
    updateTimerSlider()
}

function tick()
{
    if (inputtingWhileNotPaused)
        return

    timeLeft = moment.duration(destinationDate.diff(moment()))

    if (timeLeft.asMilliseconds() <= 0)
    {
        destinationDate = moment().add(interval)
        timeLeft = interval
    }

    updateInterface()
}

function startTimer()
{
    if (!timerPaused)
        return
    
    timerPaused = false
    destinationDate = moment().add(timeLeft)
    intervalId = setInterval(tick, updateDelay)
}

function stopTimer()
{
    if (timerPaused)
        return
    
    timerPaused = true
    clearInterval(intervalId)
}