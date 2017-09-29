let passport = require('passport')
let moment = require('moment')
let RedditStrategy = require('passport-reddit').Strategy

let User = require('../models/user')
let secret = require('../config/secret')

passport.serializeUser((user, done) =>
{
    done(null, user.id);
});

passport.deserializeUser((obj, done) =>
{
    User.findById(obj, (err, result) =>
    {
        done(err, result);
    })
});

passport.use(new RedditStrategy(
    {
        clientID: secret.reddit_clientid,
        clientSecret: secret.reddit_secret,
        callbackURL: 'http://localhost/callback',
        scope: 'submit'
    },
    (accessToken, refreshToken, profile, done) =>
    {
        User.findOne({ name: profile.name }, (err, result) =>
        {
            if (err)
                return done(err)

            let tokenExpire = moment().add(1, 'h').toDate()

            if (result)
            {
                User.findByIdAndUpdate(result.id, { accessToken: accessToken, refreshToken: refreshToken, accessTokenExpireDate: tokenExpire }, (err, result) =>
                {
                    if (err)
                        return done(err)

                    return done(null, result)
                })
            }
            else
            {
                let user = new User(
                {
                    name: profile.name,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    accessTokenExpireDate: tokenExpire,
                })

                user.save((err, result) =>
                {
                    if (err)
                        return done(err)

                    return done(null, result)
                })
            }
        })
    }
))

module.exports = passport