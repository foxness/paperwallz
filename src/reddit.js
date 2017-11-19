let rp = require('request-promise')
let moment = require('moment')
let User = require('./models/user')

class Reddit
{
    constructor(user)
    {
        this.ACCESS_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token'
        this.SUBMIT_URL = 'https://oauth.reddit.com/api/submit'
        this.USER_AGENT = 'Paperwallz by /u/foxneZz'
        this.RATELIMIT = moment.duration(10, 'minutes')

        this.CLIENT_ID = process.env.REDDIT_CLIENTID
        this.SECRET = process.env.REDDIT_SECRET

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
        if (this.user.completed.length > 0)
        {
            await this.user.populate('completed').execPopulate()
            
            let lastRedditPostDate = this.user.completed[this.user.completed.length - 1].postDate
            let canPostDate = moment(lastRedditPostDate).add(this.RATELIMIT)
            let msUntilResolved = canPostDate.diff(moment())

            if (msUntilResolved > 0) // not resolved because current time is before canPostDate
            {
                let error = new Error('REDDIT_RATELIMIT')
                error.msUntilResolved = msUntilResolved
                throw error
            }
        }

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
        {
            let error = new Error('ERRORS_IN_REDDIT_RESPONSE')
            error.errors_in_reddit_response = json.errors
            throw error
        }

        return json.data.url
    }
}

module.exports = Reddit