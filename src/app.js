let express = require('express')
let path = require('path')
let favicon = require('serve-favicon')
let logger = require('morgan')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let session = require('express-session')
let mongoose = require('mongoose')

let configuredPassport = require('./passport')
let index = require('./routes/index')

let app = express()

let mongoDB = process.env.MONGODB_URL
mongoose.Promise = global.Promise
mongoose.connect(mongoDB)
let db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

// app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({ secret: 'keyboard cat' }))
app.use(configuredPassport.initialize())
app.use(configuredPassport.session())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', index)

app.use((req, res, next) =>
{
    let err = new Error('Not Found')
    err.status = 404
    next(err)
})

app.use((err, req, res, next) =>
{
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    res.status(err.status || 500)
    res.render('error')
})

module.exports = app