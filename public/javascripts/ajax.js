$(() =>
{
    const queueInfoClass = 'queueInfo'
    paperwallz = {}

    let currentInfo = null
    let paused = true

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
                paperwallz.fillQueue()
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
                paperwallz.fillQueue()
            }
        })
    }

    paperwallz.toggle = () =>
    {
        if (paused)
            startTimer()
        else
            stopTimer()
        
        $.ajax(
        {
            method: 'POST',
            url: '/queue/' + (paused ? 'start' : 'stop'),
            // data: { id: id },
            // success: (data) => { location.reload(true) }
        })

        paused = !paused
    }

    paperwallz.fillQueue = () =>
    {
        let element = null

        if (currentInfo.queue.length > 0)
        {
            let table = $('<table/>').addClass(queueInfoClass)
            let headRow = $('<tr/>')
            headRow.append($('<th/>').text('#'))
            headRow.append($('<th/>').text('Title'))
            headRow.append($('<th/>').text('Link'))
            headRow.append($('<th/>').text('Actions'))
            table.append(headRow)

            for (let i = currentInfo.queue.length - 1; i >= 0; --i)
            {
                let r = currentInfo.queue[i]
                let row = $('<tr/>')
                row.append($('<td/>').text(currentInfo.queue.length - i))
                row.append($('<td/>').text(r.title))
                row.append($('<td/>').append($('<a/>').attr('href', r.url).text('Link')))
                row.append($('<td/>').append($('<a/>').attr({ 'href': '#', 'onclick': `paperwallz.delete('${r.id}')` }).text('Delete')))
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
        $.ajax(
        {
            type: 'GET',
            url: '/queue/info',
            dataType: 'json',
            success: (info) =>
            {
                currentInfo = info
            },
            async: false
        })
    }

    paperwallz.updateQueueInfo()
    paperwallz.fillQueue()
    updateTimer(currentInfo.queuePaused, currentInfo.queueInterval, currentInfo.queuePaused ? currentInfo.queueTimeLeft : currentInfo.queueSubmissionDate)
})