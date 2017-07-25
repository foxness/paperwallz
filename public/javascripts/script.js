// function isURL(str)
// {
//     return /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(str)
// }

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
            url: '/add',
            data: { title: title, url: url },
            success: (data) => { location.reload(true) }
        })
    }

    paperwallz.delete = (id) =>
    {
        $.ajax(
        {
            method: 'POST',
            url: '/delete',
            data: { id: id },
            success: (data) => { location.reload(true) }
        })
    }
})