$(() =>
{
    const queueBox = 'queueBox'
    paperwallz = {}
    let paused = true
    let ws = null

    paperwallz.sliderChange = () =>
    {
        ws.send(JSON.stringify({ type: 'queueTimeleft', value: { ms: Math.round(timeLeft.asMilliseconds()) } }))
    }

    paperwallz.add_submit = () =>
    {
        let title = $('#add_title').val().trim()
        let url = $('#add_url').val().trim()

        ws.send(JSON.stringify({ type: 'queueAdd', value: { title: title, url: url } }))
    }

    paperwallz.delete = (id) =>
    {
        ws.send(JSON.stringify({ type: 'queueDelete', value: { id: id } }))
    }

    paperwallz.toggle = () =>
    {
        if (paused)
            startTimer()
        else
            stopTimer()

        ws.send(JSON.stringify({ type: 'queueToggle', value: (paused ? 'start' : 'stop') }))

        paused = !paused
    }

    paperwallz.fillQueue = (queueInfo) =>
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
                let row = $('<tr/>')
                row.append($('<td/>').text(remainingItemCount--))
                row.append($('<td/>').text(r.title).addClass('titleElem'))
                row.append($('<td/>').append($('<a/>').attr('href', r.url).text('Link')))
                row.append($('<td/>').append($('<a/>').attr({ 'href': '#', 'onclick': `paperwallz.delete('${r.id}')` }).text('Delete')))
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
        $(`#${queueBox}`).sortable({
            containerSelector: 'table',
            itemPath: '> tbody',
            itemSelector: 'tr',
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
                // alert(`before: ${beforeIndex}\nafter: ${afterIndex}`)

                if (beforeIndex != afterIndex)
                {
                    beforeIndex = queueInfo.queue.length - 1 - beforeIndex
                    afterIndex = queueInfo.queue.length - 1 - afterIndex
                    // ^ why? because the frontend queue is displayed reversed

                    ws.send(JSON.stringify({ type: 'queueMove', value: { beforeIndex: beforeIndex, afterIndex: afterIndex } }))
                }
            }
          })
    }

    paperwallz.updateQueueInfo = () =>
    {
        ws.send(JSON.stringify({ type: 'queueInfo', value: null }))
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
        ws.send(JSON.stringify({ type: 'cookie', value: { cookie: paperwallz.getCookie('superSecretCookie1337') } }))
        paperwallz.updateQueueInfo()
    }
})