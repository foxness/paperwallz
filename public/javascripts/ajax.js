$(() =>
{
    const queueInfo = 'queueInfo'
    paperwallz = {}

    paperwallz.add_submit = () =>
    {
        let title = $('#add_title').val().trim()
        let url = $('#add_url').val().trim()

        $.ajax(
        {
            method: 'POST',
            url: '/queue/add',
            data: { title: title, url: url },
            success: (data) => { paperwallz.updateQueueInfo() }
        })
    }

    paperwallz.delete = (id) =>
    {
        $.ajax(
        {
            method: 'POST',
            url: '/queue/delete',
            data: { id: id },
            success: (data) => { paperwallz.updateQueueInfo() }
        })
    }

    paperwallz.post = (id) =>
    {
        $.ajax(
        {
            method: 'POST',
            url: '/queue/post',
            data: { id: id }//,
            // success: (data) => { location.reload(true) }
        })
    }

    paperwallz.start = () =>
    {
        $.ajax(
        {
            method: 'POST',
            url: '/queue/start'
            // data: { id: id },
            // success: (data) => { location.reload(true) }
        })
    }

    paperwallz.stop = () =>
    {
        $.ajax(
        {
            method: 'POST',
            url: '/queue/stop'
            // data: { id: id },
            // success: (data) => { location.reload(true) }
        })
    }

    paperwallz.updateQueueInfo = () =>
    {
        $.getJSON('/queue/info', (info) =>
        {
            let element = null

            if (info.queue.length > 0)
            {
                let table = $('<table/>').addClass(queueInfo)
                let headRow = $('<tr/>')
                headRow.append($('<th/>').text('#'))
                headRow.append($('<th/>').text('Title'))
                headRow.append($('<th/>').text('Link'))
                headRow.append($('<th/>').text('Actions'))
                table.append(headRow)

                $.each(info.queue, (rowIndex, r) =>
                {
                    let row = $('<tr/>')
                    row.append($('<td/>').text(rowIndex + 1))
                    row.append($('<td/>').text(r.title))
                    row.append($('<td/>').append($('<a/>').attr('href', r.url).text('Link')))
                    row.append($('<td/>').append($('<a/>').attr({'href': '#', 'onclick': `paperwallz.delete('${r.id}')`}).text('Delete')))
                    table.append(row)
                })

                element = table
            }
            else
            {
                element = $('<p/>').addClass(queueInfo).text('There are no wallpapers.')
            }

            $(`.${queueInfo}`).remove()
            $('body').append(element)
        })
    }

    paperwallz.updateQueueInfo()
})