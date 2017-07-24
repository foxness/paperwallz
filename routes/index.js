let express = require('express')
let router = express.Router()

let wallpaperController = require('../controllers/wallpaperController')

router.get('/', wallpaperController.wallpaper_list)
router.post('/add', wallpaperController.wallpaper_add)

module.exports = router