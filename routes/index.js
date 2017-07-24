let express = require('express')
let router = express.Router()

let mainController = require('../controllers/mainController')

router.get('/', mainController.queue_get)
router.post('/add', mainController.wallpaper_add)

module.exports = router