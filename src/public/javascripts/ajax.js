const queueBox = 'queueBox'
paperwallz = {}
let ws = null

const previewOffset = { x: 30, y: -15 }

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

let tryGetThumbnail = (imageUrl) =>
{
    let wallhaven = /https:\/\/wallpapers\.wallhaven\.cc\/wallpapers\/full\/wallhaven-(\d+)\.\w+/
    let match = wallhaven.exec(imageUrl)
    if (match)
        return `https://wallpapers.wallhaven.cc/wallpapers/thumb/small/th-${match[1]}.jpg`
    
    let imgur = /https:\/\/i\.imgur\.com\/\w+()\.\w+/
    if (imgur.test(imageUrl))
    {
        let index = imageUrl.lastIndexOf('.')
        return imageUrl.substring(0, index) + 'm' + imageUrl.substring(index)
    }
    
    return imageUrl
}

let leadZero = (s) =>
{
    return s.toString().length == 1 ? '0' + s : s
}

let updateQueueIndexes = () =>
{
    let rows = $(`#${queueBox}`).children()[1].children

    for (let i = 0; i < rows.length; ++i)
        rows[rows.length - i - 1].children[0].innerHTML = i + 1
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
            row.append($('<td/>').append($('<a/>').addClass('imageLink').attr('href', r.url).text('Link')))
            row.append($('<td/>').append($('<a/>').attr({ 'href': '#', 'onclick': `sendQueueDelete('${r.id}')` }).text('Delete')))
            tbody.append(row)
        }

        for (let i = queueInfo.queueCompleted.length - 1; i >= 0; --i)
        {
            let r = queueInfo.queueCompleted[i]
            let row = $('<tr/>').addClass('completed')
            row.append($('<td/>').text(remainingItemCount--))
            row.append($('<td/>').text(r.title).addClass('titleElem'))
            row.append($('<td/>').append($('<a/>').addClass('imageLink').attr('href', r.url).text('Link')))
            row.append($('<td/>').append($('<a/>').attr({ 'href': r.postUrl }).text('Open Post')))
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

            updateQueueIndexes()
        }
    })

    let interval = moment.duration(queueInfo.queueInterval)
    $('#hourSetting').val(interval.hours())
    $('#minuteSetting').val(leadZero(interval.minutes()))

    $('.imageLink').on('mouseenter', (event) =>
    {
        $('.previewImg').attr('src', tryGetThumbnail(event.target.href))
        $('.preview').show()
    })

    $('.imageLink').on('mouseleave', () =>
    {
        $('.preview').hide()
    })

    $('.imageLink').on('mousemove', () =>
    {
        $('.preview').css({ left: event.pageX + previewOffset.x, top: event.pageY + previewOffset.y })
    })
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

let requestImgurInfo = () =>
{
    sendToServer('imgurInfo', null)
}

let sendAuthCookie = (authCookie) =>
{
    sendToServer('cookie', { cookie: authCookie })
}

let getWebsocketServerUri = () =>
{
    let host = /https?:\/\/([^/]+)/
    return `ws://${host.exec(window.location.href)[1]}`
}

ws = new WebSocket(getWebsocketServerUri())

ws.onmessage = (event) =>
{
    let json = JSON.parse(event.data)

    if (json.type == 'queueInfo')
    {
        let queueInfo = json.value
        fillQueue(queueInfo)
        updateTimer(queueInfo.queuePaused, queueInfo.queueInterval, queueInfo.queuePaused ? queueInfo.queueTimeLeft : queueInfo.queueSubmissionDate)
    }
    else if (json.type == 'imgurInfo')
    {
        if (json.value.imgurConnected)
        {
            $('#imgurLink').text(`Connected to Imgur: ${json.value.imgurName}`)
            $('#imgurLink').attr('href', '#')
        }
        else
        {
            $('#imgurLink').attr('href', `https://api.imgur.com/oauth2/authorize?client_id=${json.value.imgurClientId}&response_type=token`)
        }
    }
    else if (json.type == 'imgurJson')
    {
        window.location.assign(json.value.data.link)
    }
    else if (json.type == 'error')
    {
        switch (json.errorType)
        {
            case 'ratelimit':
            {
                alert(`Reddit ratelimit: try again ${moment.duration(json.msUntilResolved).humanize(true)}`)

                break
            }

            default:
            {
                alert(`Unknown server error: ${event.data}`)
            }
        }
    }
    else
    {
        alert(`Unknown server response: ${event.data}`)
    }
}

ws.onopen = (event) =>
{
    sendAuthCookie(getCookie('superSecretCookie1337'))
    requestQueueInfo()
    requestImgurInfo()
}