// let request = require('request')
let rp = require('request-promise')
// let async = require('async')
// let moment = require('moment')
let secretJs = require('./config/secret')
let User = require('./models/user')

class Imgur
{
    constructor(user)
    {
        this.UPLOAD_IMAGE_URL = 'https://api.imgur.com/3/image'
        this.USER_AGENT = 'Paperwallz by /u/foxneZz'

        this.CLIENT_ID = secretJs.reddit_clientid
        this.SECRET = secretJs.reddit_secret

        this.user = user
    }

    async post(image_url)
    {
        let requestOptions =
        {
            headers: { 'User-Agent': this.USER_AGENT },
            auth: { bearer: this.user.imgurAccessToken },
            form:
            {
                'image': image_url,
                'type': 'URL',
                'title': 'testy is besty',
            }
        }

        let response = await rp.post(this.UPLOAD_IMAGE_URL, requestOptions)
        
        return JSON.parse(response)
    }
}

module.exports = Imgur