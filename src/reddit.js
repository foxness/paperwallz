let request = require('request')
let async = require('async')
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
                refresh_token: this.user.redditRefreshToken
            }
        }

        request.post(this.ACCESS_TOKEN_URL, requestOptions, (err, response, body) =>
        {
            if (!err)
            {
                User.findByIdAndUpdate(this.user.id, { redditAccessToken: JSON.parse(body).access_token, redditAccessTokenExpirationDate: moment().add(1, 'h').toDate() }, ((err, result) =>
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

    post(image_url, title)
    {
        return new Promise(((resolve, reject) =>
        {
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
    
            let funcs =
            [
                (callback) =>
                {
                    request.post(this.SUBMIT_URL, requestOptions, (err, response, body) =>
                    {
                        if (err)
                            return reject(err)
                        
                        if (response.statusCode != 200)
                            return reject(response)
    
                        let json = JSON.parse(body).json
    
                        if (json.errors.length > 0)
                            return reject(json.errors)
                        
                        resolve(json.data.url)
                    })
                }
            ]
    
            if (!this.user.redditAccessToken || moment().isAfter(moment(this.user.redditAccessTokenExpirationDate)))
            {
                funcs.unshift((callback) => { this.refreshAccessToken(callback) })
            }
    
            async.series(funcs, (err, results) =>
            {
                if (err)
                    return reject(err)
                
                resolve(results.pop())
            })
        }).bind(this))
    }
}

module.exports = Reddit