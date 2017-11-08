let rp = require('request-promise')
let moment = require('moment')
let secretJs = require('./config/secret')
let User = require('./models/user')

class Reddit
{
    constructor(user)
    {
        this.ACCESS_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token'
        this.SUBMIT_URL = 'https://oauth.reddit.com/api/submit'
        this.USER_AGENT = 'Paperwallz by /u/foxneZz'

        this.CLIENT_ID = secretJs.reddit_clientid
        this.SECRET = secretJs.reddit_secret

        this.user = user
    }

    async refreshAccessToken()
    {
        let requestOptions =
        {
            headers: { 'User-Agent': this.USER_AGENT },
            auth:
            {
                user: this.CLIENT_ID,
                pass: this.SECRET
            },
            form:
            {
                grant_type: 'refresh_token',
                refresh_token: this.user.redditRefreshToken
            }
        }

        let responseBody = await rp.post(this.ACCESS_TOKEN_URL, requestOptions)

        this.user = await User.findByIdAndUpdate(this.user.id,
            {
                redditAccessToken: JSON.parse(responseBody).access_token,
                redditAccessTokenExpirationDate: moment().add(1, 'h').toDate()
            })
    }

    async post(image_url, title)
    {
        if (!this.user.redditAccessToken || moment().isAfter(moment(this.user.redditAccessTokenExpirationDate)))
        {
            await this.refreshAccessToken()
        }

        let requestOptions =
        {
            headers: { 'User-Agent': this.USER_AGENT },
            auth: { bearer: this.user.redditAccessToken },
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

        let responseBody = await rp.post(this.SUBMIT_URL, requestOptions)

        let json = JSON.parse(responseBody).json
        
        if (json.errors.length > 0)
            throw new Error(`REDDIT POST ERROR: ${JSON.stringify(json.errors)}`)

        return json.data.url
    }
}

module.exports = Reddit