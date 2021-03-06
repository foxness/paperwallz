#!/usr/bin/env node

const dotenv = require('dotenv').config({ path: 'config.env' })

if (dotenv.error && dotenv.error.message.indexOf('ENOENT: no such file or directory') == -1) // ignores missing config.env
    throw dotenv.error

const configVarNames =
    [
        'MONGODB_URL',
        'REDDIT_CLIENTID',
        'REDDIT_SECRET',
        'REDDIT_CALLBACK',
        'IMGUR_CLIENTID',
        'IMGUR_SECRET',
        'IMGUR_CALLBACK',
    ]

for (let i = 0; i < configVarNames.length; ++i)
{
    if (!process.env[configVarNames[i]])
        throw new Error(`Missing config variable: ${configVarNames[i]}`)
}

process.env.DEBUG = process.env.DEBUG || 'paperwallz:info,paperwallz:verbose'
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

process.on('unhandledRejection', up => { console.error(up.stack); throw up; })

let app = require('../app')
let debug = require('debug')
let debugInfo = debug('paperwallz:info')

debugInfo(`DEBUG: ${process.env.DEBUG}\nNODE_ENV: ${process.env.NODE_ENV}`)

let http = require('http')
let Globals = require('../globals')

Globals.productionEnv = process.env.NODE_ENV === 'production'

const port = process.env.PORT || 80
app.set('port', port)

let server = http.createServer(app)
Globals.httpServer = server
let wss = require('../websocketServer') // this should be enough to make it work already (no need to 'start' it)

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

function onError(error)
{
    if (error.syscall !== 'listen')
        throw error

    let bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port

    switch (error.code)
    {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges')
            process.exit(1)
            break
        case 'EADDRINUSE':
            console.error(bind + ' is already in use')
            process.exit(1)
            break
        default:
            throw error
    }
}

function onListening()
{
    let addr = server.address()
    let bind = typeof addr === 'string' ?
        'pipe ' + addr :
        'port ' + addr.port
    debugInfo('Listening on ' + bind)
}