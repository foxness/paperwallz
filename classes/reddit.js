let request = require('request')
let secretJs = require('../config/secret')

class Reddit
{
    constructor(refreshToken, accessToken)
    {
        this.ACCESS_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token'
        this.SUBMIT_URL = 'https://oauth.reddit.com/api/submit'

        this.clientId = secretJs.reddit_clientid
        this.secret = secretJs.reddit_secret
        this.refreshToken = refreshToken
        this.accessToken = accessToken

        if (accessToken === undefined)
            throw new Error('Not implemented yet')

        this.requestOptions = {
            headers: { 'User-Agent': 'Paperwallz by /u/foxneZz' },
            'auth': { 'bearer': accessToken }
        }
    }

    post(image_url, title, callback)
    {
        let requestOptions =
        {
            form:
            {
                'api_type': 'json',
                'kind': 'self',
                'resubmit': 'true',
                'sendreplies': 'true',
                'sr': 'test',
                'text': image_url,
                // 'url': image_url,
                'title': title
            }
        }

        let a = Object.assign(this.requestOptions, requestOptions);

        request.post(this.SUBMIT_URL, Object.assign(this.requestOptions, requestOptions), (err, response, body) =>
        {
            console.log(`err: ${err}\nresponse: ${response}\nbody: ${body}`)
            callback()
        })
    }
}

module.exports = Reddit