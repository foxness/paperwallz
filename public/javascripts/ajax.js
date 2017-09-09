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
})