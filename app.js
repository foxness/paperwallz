let express = require('express')
let path = require('path')
let favicon = require('serve-favicon')
let logger = require('morgan')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let passport = require('passport')
let session = require('express-session')
let moment = require('moment')
let RedditStrategy = require('passport-reddit').Strategy

let User = require('./models/user')
let secret = require('./config/secret')

let index = require('./routes/index')

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
                let user = new User({ name: profile.name, accessToken: accessToken, refreshToken: refreshToken, accessTokenExpireDate: tokenExpire })
                user.save((err) =>
                {
                    if (err)
                        return done(err)

                    return done(null, user)
                })
            }
        })
    }
))

let app = express()

//Set up mongoose connection
let mongoose = require('mongoose')
let mongoDB = secret.mongodb
mongoose.connect(mongoDB)
let db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({ secret: 'keyboard cat' }))
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', index)

// catch 404 and forward to error handler
app.use(function(req, res, next)
{
    let err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handler
app.use(function(err, req, res, next)
{
    console.log(err)
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render('error')
})

module.exports = app