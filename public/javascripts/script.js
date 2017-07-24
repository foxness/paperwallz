function isURL(str)
{
    return /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(str)
}

$(() =>
{
    // $('.error').css('display', 'flex').hide()

    // jQuery.showError = () =>
    // {
    //     $('.error').slideDown().delay(5000).slideUp()
    // }    

    jQuery.submit = () =>
    {
        let title = $('#title').val().trim()
        let url = $('#url').val().trim()
        // if (title.length == 0 || !isURL(title))
        // {
        //     alert('Bad input')
        //     // jQuery.showError()
        //     return
        // }

        $.ajax(
        {
            method: 'POST',
            url: '/add',
            data: { title: title, url: url },
            success: (data) =>
            {
                location.reload(true)
                // alert('success')
                // if (data == 'url not valid')
                // {
                //     jQuery.showError()
                //     return
                // }

                // let link = `http://${location.hostname}/${data}`
                // $('.genUrl').text(link).attr('href', link).show()
            }
        })
    }

    // $('#text').focus().select()

    // $("#text").keypress((e) =>
    // {
    //     if ((e.keyCode ? e.keyCode : e.which) == 13) // enter pressed
    //     {
    //         e.preventDefault();
    //         jQuery.submit()
    //     }
    // })
})