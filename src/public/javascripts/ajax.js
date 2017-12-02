const queueBox = 'queueBox'
paperwallz = {}
let ws = null
const useSecureWebsockets = false
const websocketProtocol = useSecureWebsockets ? 'wss' : 'ws'

const previewOffset = { x: 30, y: -15 }

window.mobilecheck = function() {
    var check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };

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

    if (!mobilecheck())
    {
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
    }

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
    return `${websocketProtocol}://${host.exec(window.location.href)[1]}`
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
                alert(`ERROR - reddit ratelimit - try again ${moment.duration(json.msUntilResolved).humanize(true)}`)

                break
            }

            case 'emptyQueue':
            {
                alert('ERROR - empty queue - there\'s nothing to post')

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