let request = require('request')
let async = require('async')
let moment = require('moment')
let secretJs = require('../config/secret')
let User = require('../models/user')

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

    refreshAccessToken(callback)
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
                refresh_token: this.user.refreshToken
            }
        }

        request.post(this.ACCESS_TOKEN_URL, requestOptions, (err, response, body) =>
        {
            if (!err)
            {
                User.findByIdAndUpdate(this.user.id, { accessToken: JSON.parse(body).access_token, accessTokenExpireDate: moment().add(1, 'h').toDate() }, ((err, result) =>
                {
                    this.user = result
                    callback(err)
                }).bind(this))
            }
            else
            {
                callback(err)
            }
        })
    }

    post(image_url, title, callback)
    {
        let requestOptions =
        {
            headers: { 'User-Agent': this.USER_AGENT },
            auth: { bearer: this.user.accessToken },
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

        let funcs =
        [
            (callback) =>
            {
                request.post(this.SUBMIT_URL, requestOptions, (err, response, body) =>
                {
                    if (err)
                        return callback(err)

                    let parsed = JSON.parse(body).json

                    if (parsed.errors.length > 0)
                        return callback(parsed.errors)
                    
                    callback(err, parsed.data.url)
                })
            }
        ]

        if (!this.user.accessToken || moment().isAfter(moment(this.user.accessTokenExpireDate)))
        {
            funcs.unshift((callback) => { this.refreshAccessToken(callback) })
        }

        async.series(funcs, (err, results) =>
        {
            callback(err, results.pop())
        })
    }
}

module.exports = Reddit