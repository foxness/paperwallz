const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser');

const app = express()

const dataFile = 'database/data.txt'
const port = 80

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'))

app.listen(port, () =>
{
    console.log(`Server running at http://localhost:${port}/`)
})