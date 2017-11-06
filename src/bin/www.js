#!/usr/bin/env node

process.on('unhandledRejection', up => { console.log(up.stack); throw up; })

let app = require('../app')
let debug = require('debug')('paperwallz:server')
let http = require('http')
let Globals = require('../globals')

const port = 80
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
    debug('Listening on ' + bind)
}