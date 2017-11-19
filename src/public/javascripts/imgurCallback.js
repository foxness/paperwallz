const useSecureWebsockets = false
const websocketProtocol = useSecureWebsockets ? 'wss' : 'ws'

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

let getWebsocketServerUri = () =>
{
    let host = /https?:\/\/([^/]+)/g
    return `${websocketProtocol}://${host.exec(window.location.href)[1]}`
}

ws = new WebSocket(getWebsocketServerUri())

ws.onmessage = (event) =>
{
    let json = JSON.parse(event.data)
    
    if (json.status == 'OK')
    {
        let host = /\w+:\/\/[^/]+\//
        window.location.assign(`${host.exec(window.location.href)[0]}queue`)
    }
}

ws.onopen = (event) =>
{
    sendAuthCookie(getCookie('superSecretCookie1337'))
    sendImgurCallbackData(getImgurCallbackData())
}