let getImgurCallbackData = () =>
{
    let url = window.location.href
    let queryArray = url.substring(url.indexOf('#') + 1).split('&')
    let query = {}
    
    for (let i = 0; i < queryArray.length; ++i)
    {
        let split = queryArray[i].split('=')
        query[split[0]] = split[1]
    }

    return query
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

let sendAuthCookie = (authCookie) =>
{
    sendToServer('cookie', { cookie: authCookie })
}

let sendImgurCallbackData = (data) =>
{
    sendToServer('imgurCallbackData', data)
}

let ws = new WebSocket('ws://localhost')

ws.onmessage = (event) =>
{
    let json = JSON.parse(event.data)
    
    if (json.status == 'OK')
        window.location.assign('http://localhost/queue')
}

ws.onopen = (event) =>
{
    sendAuthCookie(getCookie('superSecretCookie1337'))
    sendImgurCallbackData(getImgurCallbackData())
}