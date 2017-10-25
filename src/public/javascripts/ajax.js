const queueBox = 'queueBox'
paperwallz = {}
let ws = null

$(() =>
{
    $('#toggle').on('click', () =>
    {
        if (timerPaused)
            startTimer()
        else
            stopTimer()

        sendQueueToggle(!timerPaused)
    })

    $('#slider').on('change', () =>
    {
        sendQueueTimeleft(Math.round(timeLeft.asMilliseconds()))
    })

    $('#add_submit').on('click', () =>
    {
        let title = $('#add_title').val().trim()
        let url = $('#add_url').val().trim()

        sendQueueAdd(title, url)
    })

    $('#slider').on('input', () =>
    {
        let ratio = 1 - $('#slider').val() / $('#slider').prop('max')
        timeLeft = moment.duration(interval.asMilliseconds() * ratio)
        updateTimerText()
    })

    $(window).on('click', (event) =>
    {
        if (event.target == $('#fade')[0])
        {
            $('#fade').hide()
        }
    })

    $('#settings').on('click', () =>
    {
        $('#fade').show()
    })

    $('#settingsCancel').on('click', () =>
    {
        $('#fade').hide()
    })

    $('#settingsOk').on('click', () =>
    {
        if (!timerPaused)
        {
            $('#myPopup').css('visibility', 'visible')
            setTimeout(() =>
            {
                $('#myPopup').css('visibility', 'hidden')
            }, 3000)

            return
        }

        $('#fade').hide()

        let hours = parseInt($('#hourSetting').val())
        let minutes = parseInt($('#minuteSetting').val())
        let ms = (minutes * 1000*60) + (hours * 1000*60*60)
        sendQueueInterval(ms)
        changeInterval(ms)
    })

    $('#minuteSetting').on('change', (input) =>
    {
        if (!isNaN(input.target.value) && input.target.value.length === 1)
        {
            input.target.value = leadZero(input.target.value)
        }
    })

    $('#test').on('click', () =>
    {
        sendToServer('imgurTest', null)
    })
})

let leadZero = (s) =>
{
    return s.toString().length == 1 ? '0' + s : s
}

let fillQueue = (queueInfo) =>
{
    let element = null
    if (queueInfo.queue.length + queueInfo.queueCompleted.length > 0)
    {
        let table = $('<table/>').attr('id', queueBox)
        let thead = $('<thead/>')
        let headRow = $('<tr/>')
        headRow.append($('<th/>').text('#').attr('id', 'headNumber'))
        headRow.append($('<th/>').text('Title').attr('id', 'headTitle'))
        headRow.append($('<th/>').text('Link').attr('id', 'headLink'))
        headRow.append($('<th/>').text('Actions').attr('id', 'headActions'))
        thead.append(headRow)
        table.append(thead)

        let tbody = $('<tbody/>')
        let remainingItemCount = queueInfo.queue.length + queueInfo.queueCompleted.length
        for (let i = queueInfo.queue.length - 1; i >= 0; --i)
        {
            let r = queueInfo.queue[i]
            let row = $('<tr/>').addClass('notCompleted')
            row.append($('<td/>').text(remainingItemCount--))
            row.append($('<td/>').text(r.title).addClass('titleElem'))
            row.append($('<td/>').append($('<a/>').attr('href', r.url).text('Link')))
            row.append($('<td/>').append($('<a/>').attr({ 'href': '#', 'onclick': `sendQueueDelete('${r.id}')` }).text('Delete')))
            tbody.append(row)
        }

        for (let i = queueInfo.queueCompleted.length - 1; i >= 0; --i)
        {
            let r = queueInfo.queueCompleted[i]
            let row = $('<tr/>').addClass('completed')
            row.append($('<td/>').text(remainingItemCount--))
            row.append($('<td/>').text(r.title).addClass('titleElem'))
            row.append($('<td/>').append($('<a/>').attr('href', r.url).text('Link')))
            row.append($('<td/>').append($('<a/>').attr({ 'href': r.completedUrl }).text('Open Post')))
            tbody.append(row)
        }

        table.append(tbody)
        element = table
    }
    else
    {
        element = $('<p/>').attr('id', queueBox).text('There are no wallpapers.')
    }

    $(`#${queueBox}`).remove()
    $('#main').append(element)

    let beforeIndex = null
    $(`#${queueBox}`).sortable(
    {
        containerSelector: 'table',
        itemPath: '> tbody',
        itemSelector: 'tr.notCompleted',
        placeholder: '<tr class="placeholder"/>',
        onDragStart: ($item, container, _super, event) =>
        {
            _super($item, container, _super, event)

            beforeIndex = $item[0].sectionRowIndex
        },
        onDrop: ($item, container, _super, event) =>
        {
            _super($item, container, _super, event)

            let afterIndex = $item[0].sectionRowIndex

            if (beforeIndex != afterIndex)
            {
                beforeIndex = queueInfo.queue.length - 1 - beforeIndex
                afterIndex = queueInfo.queue.length - 1 - afterIndex
                // ^ why? because the frontend queue is displayed reversed

                sendQueueMove(beforeIndex, afterIndex)
            }
        }
    })

    let interval = moment.duration(queueInfo.queueInterval)
    $('#hourSetting').val(interval.hours())
    $('#minuteSetting').val(leadZero(interval.minutes()))
}

let getCookie = (cname) =>
{
    let name = cname + '='
    let decodedCookie = decodeURIComponent(document.cookie)
    let ca = decodedCookie.split(';')
    for (let i = 0; i < ca.length; i++)
    {
        let c = ca[i]
        while (c.charAt(0) == ' ')
            c = c.substring(1)

        if (c.indexOf(name) == 0)
            return c.substring(name.length, c.length)
    }

    return ''
}

let sendToServer = (type, value) =>
{
    ws.send(JSON.stringify({ type: type, value: value }))
}

let sendQueueTimeleft = (ms) =>
{
    sendToServer('queueTimeleft', { ms: ms })
}

let sendQueueAdd = (title, url) =>
{
    sendToServer('queueAdd', { title: title, url: url })
}

let sendQueueDelete = (id) =>
{
    sendToServer('queueDelete', { id: id })
}

let sendQueueToggle = (start) =>
{
    sendToServer('queueToggle', (start ? 'start' : 'stop'))
}

let sendQueueMove = (beforeIndex, afterIndex) =>
{
    sendToServer('queueMove', { beforeIndex: beforeIndex, afterIndex: afterIndex })
}

let sendQueueInterval = (ms) =>
{
    sendToServer('queueInterval', { ms: ms })
}

let requestQueueInfo = () =>
{
    sendToServer('queueInfo', null)
}

let sendAuthCookie = (authCookie) =>
{
    sendToServer('cookie', { cookie: authCookie })
}

ws = new WebSocket('ws://localhost')

ws.onmessage = (event) =>
{
    let json = JSON.parse(event.data)

    if (json.type == 'queueInfo')
    {
        let queueInfo = json.value
        fillQueue(queueInfo)
        updateTimer(queueInfo.queuePaused, queueInfo.queueInterval, queueInfo.queuePaused ? queueInfo.queueTimeLeft : queueInfo.queueSubmissionDate)
    }
}

ws.onopen = (event) =>
{
    sendAuthCookie(getCookie('superSecretCookie1337'))
    requestQueueInfo()
}