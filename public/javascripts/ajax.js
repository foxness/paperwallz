$(() =>
{
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
            success: (data) => { location.reload(true) }
        })
    }

    paperwallz.delete = (id) =>
    {
        $.ajax(
        {
            method: 'POST',
            url: '/queue/delete',
            data: { id: id },
            success: (data) => { location.reload(true) }
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

    paperwallz.fillThePage = () =>
    {
        $.getJSON('/queue/info', (info) =>
        {
            $('body').append('<br>')

            if (info.queue.length > 0)
            {
                let table = $('<table/>')
                let headRow = $('<tr/>')
                headRow.append($('<th/>').text('#'))
                headRow.append($('<th/>').text('Title'))
                headRow.append($('<th/>').text('Link'))
                table.append(headRow)

                $.each(info.queue, (rowIndex, r) =>
                {
                    let row = $('<tr/>')
                    row.append($('<td/>').text(rowIndex + 1))
                    row.append($('<td/>').text(r.title))
                    row.append($('<td/>').append($('<a/>').attr('href', r.url).text('Link')))
                    table.append(row)
                })

                $('body').append(table)
            }
            else
            {
                $('body').append('<p>There are no wallpapers.</p>')
            }
        })
    }

    paperwallz.fillThePage()
})