$(() =>
{
    const queueInfoClass = 'queueInfo'
    paperwallz = {}
    let paused = true
    let ws = null

    paperwallz.add_submit = () =>
    {
        let title = $('#add_title').val().trim()
        let url = $('#add_url').val().trim()

        $.ajax(
        {
            method: 'POST',
            url: '/queue/add',
            data: { title: title, url: url },
            success: (data) =>
            {
                paperwallz.updateQueueInfo()
            }
        })
    }

    paperwallz.delete = (id) =>
    {
        $.ajax(
        {
            method: 'POST',
            url: '/queue/delete',
            data: { id: id },
            success: (data) =>
            {
                paperwallz.updateQueueInfo()
            }
        })
    }

    paperwallz.toggle = () =>
    {
        if (paused)
            startTimer()
        else
            stopTimer()

        ws.send(JSON.stringify({ type: 'queue', value: (paused ? 'start' : 'stop') }))

        paused = !paused
    }

    paperwallz.fillQueue = (queueInfo) =>
    {
        let element = null

        if (queueInfo.queue.length > 0)
        {
            let table = $('<table/>').addClass(queueInfoClass)
            let headRow = $('<tr/>')
            headRow.append($('<th/>').text('#'))
            headRow.append($('<th/>').text('Title'))
            headRow.append($('<th/>').text('Link'))
            headRow.append($('<th/>').text('Actions'))
            table.append(headRow)

            let remainingItemCount = queueInfo.queue.length + queueInfo.queueCompleted.length
            for (let i = queueInfo.queue.length - 1; i >= 0; --i)
            {
                let r = queueInfo.queue[i]
                let row = $('<tr/>')
                row.append($('<td/>').text(remainingItemCount--))
                row.append($('<td/>').text(r.title))
                row.append($('<td/>').append($('<a/>').attr('href', r.url).text('Link')))
                row.append($('<td/>').append($('<a/>').attr({ 'href': '#', 'onclick': `paperwallz.delete('${r.id}')` }).text('Delete')))
                table.append(row)
            }

            for (let i = queueInfo.queueCompleted.length - 1; i >= 0; --i)
            {   
                let r = queueInfo.queueCompleted[i]
                let row = $('<tr/>').addClass('completed')
                row.append($('<td/>').text(remainingItemCount--))
                row.append($('<td/>').text(r.title))
                row.append($('<td/>').append($('<a/>').attr('href', r.url).text('Link')))
                row.append($('<td/>').append($('<a/>').attr({ 'href': r.completedUrl }).text('Open Post')))
                table.append(row)
            }

            element = table
        }
        else
        {
            element = $('<p/>').addClass(queueInfoClass).text('There are no wallpapers.')
        }

        $(`.${queueInfoClass}`).remove()
        $('body').append(element)
    }

    paperwallz.updateQueueInfo = () =>
    {
        ws.send(JSON.stringify({ type: 'need', value: 'queueInfo' }))
    }

    paperwallz.getCookie = (cname) =>
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

    ws = new WebSocket('ws://localhost')
    
    ws.onmessage = (event) =>
    {
        let json = JSON.parse(event.data)

        if (json.type == 'queueInfo')
        {
            let queueInfo = json.value
            paperwallz.fillQueue(queueInfo)
            updateTimer(queueInfo.queuePaused, queueInfo.queueInterval, queueInfo.queuePaused ? queueInfo.queueTimeLeft : queueInfo.queueSubmissionDate)
        }
    }

    ws.onopen = (event) =>
    {
        ws.send(JSON.stringify({ type: 'cookie', value: paperwallz.getCookie('superSecretCookie1337') }))
        paperwallz.updateQueueInfo()
    }
})